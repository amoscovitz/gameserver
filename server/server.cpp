#include "stdafx.h"
#include "server.h"
#include "time.h"
#include "vector"
#include "string"
#include "event.h"

#pragma region ErrorMessenger definition
//-----------------------------------------------------------------------------------------------------------------------
// ErrorMessenger
//-----------------------------------------------------------------------------------------------------------------------
Logger::ErrorMessenger::ErrorMessenger(void)
{
	//s_pLogMgr->AddErrorMessenger(this);
	//m_enabled = true;
}

void Logger::ErrorMessenger::Show(const std::string& errorMessage, bool isFatal, const char* funcName, const char* sourceFile, unsigned int lineNum)
{
	if (m_enabled)
	{
		//if (s_pLogMgr->Error(errorMessage, isFatal, funcName, sourceFile, lineNum) == LogMgr::LOGMGR_ERROR_IGNORE)
		//	m_enabled = false;
	}
}
#pragma endregion

const char *BinaryPacket::g_Type = "BinaryPacket";
const char *TextPacket::g_Type = "TextPacket";
const char *HTTPPacket::g_Type = "HTTPPacket";
BaseSocketManager *g_pSocketManager = NULL;
const int binaryProtocol = 0;
const int bodysizemax = 64;

GenericObjectFactory<IEventData, EventType> g_eventFactory;

TextPacket::TextPacket(char const * const text)
:BinaryPacket(static_cast<u_long>(strlen(text) + 2))
{
	MemCpy(text, strlen(text), 0);
	MemCpy("\r\n", 2, 2);
	*(u_long *)m_data = 0;
}

HTTPPacket::HTTPPacket(char const * const text)
:BinaryPacket(static_cast<u_long>(strlen(text) + 2))
{
	memset(m_data+4, '\0', strlen(text));
	MemCpy(text, strlen(text), 0);
	*(u_long *)m_data = 0;
}

NetSocket::NetSocket(){
	m_sock = INVALID_SOCKET;
	m_delete_flag = 0;
	m_sendOfs = 0;
	m_timeout = 0;
	m_recvOfs = m_recvBegin = 0;
	m_internal = 0;
	m_bBinaryProtocol = binaryProtocol;
}

NetSocket::NetSocket(SOCKET new_Sock, unsigned int hostIP){
	m_delete_flag = 0;
	m_sendOfs = 0;
	m_timeout = 0;
	m_recvOfs = m_recvBegin = 0;
	m_internal = 0;
	m_bBinaryProtocol = binaryProtocol;

	m_timeCreated = timeGetTime();

	m_sock = new_Sock;
	m_ipaddr = hostIP;
	
	ZeroMemory(m_recvBuf, RECV_BUFFER_SIZE);
	ZeroMemory(m_responseBuf, RECV_BUFFER_SIZE);

	m_internal = g_pSocketManager->IsInternal(m_ipaddr);
	setsockopt(m_sock, SOL_SOCKET, SO_DONTLINGER, NULL, 0);

}

NetSocket::~NetSocket(){
	if (m_sock != INVALID_SOCKET){
		closesocket(m_sock);
		m_sock = INVALID_SOCKET;
	}
}

bool NetSocket::Connect(unsigned int ip, unsigned int port, bool forceCoalesce){
	struct sockaddr_in sa;
	int x = 1;
	wchar_t buf[1024];
	
	// create socket handle
	if ((m_sock = socket(AF_INET, SOCK_STREAM, 0)) == INVALID_SOCKET){
		return false;
	}

	if (!forceCoalesce){
		setsockopt(m_sock, IPPROTO_TCP, TCP_NODELAY, (char *)&x, sizeof(x));
	}

	// set ip addr and port of the server then connect
	sa.sin_family = AF_INET;
	sa.sin_addr.S_un.S_addr	= htonl(ip);
	sa.sin_port = htons(port);//port;

	if (connect(m_sock, (struct sockaddr*)&sa, sizeof(sa))){
		_snwprintf_s(buf, 1024, _TRUNCATE, L"Error %d\n", WSAGetLastError());
		OutputDebugString(buf);
		closesocket(m_sock);
		m_sock =INVALID_SOCKET;
		return false;
	}
	return true;
}

void NetSocket::SetBlocking(bool blocking){
	unsigned long val = blocking ? 0 : 1;
	ioctlsocket(m_sock, FIONBIO, &val);
}

void NetSocket::Send(std::shared_ptr<IPacket> pkt, bool clearTimeout){
	if (clearTimeout){
		m_timeout = 0;
	}
	m_OutList.push_back(pkt);
}

void NetSocket::VHandleOutput(){
	int fSent = 0;
	
	do{
		GCC_ASSERT(!m_OutList.empty());
		PacketList::iterator i = m_OutList.begin();

		std::shared_ptr<IPacket> pkt = *i;
		const char *buf = pkt->VGetData();
		int len = static_cast<int> (pkt->VGetSize());
		int rc = send(m_sock, buf, len, 0);
		if (rc > 0){
			g_pSocketManager->AddToOutBound(rc);
			m_sendOfs += rc;
			fSent = 1;
		}
		else if (WSAGetLastError() != WSAEWOULDBLOCK){
			HandleException();
			fSent = 0;
		}
		else{
			fSent = 0;
		}

		if (m_sendOfs == pkt->VGetSize()){
			m_OutList.pop_front();
			m_sendOfs = 0;
		}

	} while (fSent && !m_OutList.empty());
}

bool NetSocket::IsHttpRequest(const char* message){
	int i = 0;
	int space = 0;
	int idSpace = 0;
	char str2[5];
	bool isHttpMethod = 0;

	if (strlen(message) < 14){
		return 1;
	}

	while (i < strlen(message)){
		char ch = *(message + i);
		if (ch == ' '){
			if (space == 0){
				strncpy_s(str2, i+1, &message[0], i);
				if (!strcmp("GET", &str2[0]) || !strcmp("POST", &str2[0]) || !strcmp("PUT", &str2[0])){
					isHttpMethod = 1;
				}
			}
			else if (space == 2){
				strncpy_s(str2, 5, &message[idSpace+1], 4);
				break;
			}
			++space;
			idSpace = i;
		}
		++i;
	}
	if (!strncmp("HTTP", &str2[0], 4) && isHttpMethod){
		return 1;
	}
	return 0;
}

void NetSocket::VHandleInput(){
	bool bPktReceived = false;
	u_long packetSize = 0;
	char metrics[1024];
	int rc = recv(m_sock, m_recvBuf + m_recvBegin + m_recvOfs, RECV_BUFFER_SIZE - (m_recvBegin + m_recvOfs), 0);
	sprintf_s(metrics, 1024, "Incoming: %6d bytes. Begin %6d Offset %4d Size %6d\n", rc, m_recvBegin, m_recvOfs, sizeof(m_recvBuf));	
	printf_s(metrics);
	
	if (rc == SOCKET_ERROR || rc == 0){
		m_delete_flag = 1;
		return;
	}

	const int hdrSize = sizeof(u_long);
	unsigned int newData = m_recvOfs + rc;
	int processedData = 0;

	while (newData > hdrSize){
		if (m_bBinaryProtocol){
			packetSize = *(reinterpret_cast<u_long*>(m_recvBuf + m_recvBegin));
			packetSize = ntohl(packetSize);
			
			// not enough new_data for next packet
			if (newData < packetSize){
				break;
			}

			if (packetSize > MAX_PACKET_SIZE){
				HandleException();
				return;
			}

			if (newData >= packetSize){
				// we know size of the packet and we have it all
				BinaryPacket *bPack = GCC_NEW BinaryPacket(
					&m_recvBuf[m_recvBegin + hdrSize], packetSize - hdrSize);
				std::shared_ptr<BinaryPacket> pkt(bPack);
					
				m_InList.push_back(pkt);
				bPktReceived = true;
				processedData += packetSize;
				newData -= packetSize;
				m_recvBegin += packetSize;
			}
		}
		else{
			if (IsHttpRequest(&m_recvBuf[m_recvBegin])){
				HTTPPacket *packet = GCC_NEW HTTPPacket(&m_recvBuf[m_recvBegin]);
				std::shared_ptr<HTTPPacket> pkt(packet);

				m_InList.push_front(pkt);
				packetSize = strlen(m_recvBuf);
				bPktReceived = true;

				processedData += packetSize;
				newData -= packetSize;
				m_recvBegin += packetSize;
			}
			else{
				char *cr = static_cast<char *>(memchr(&m_recvBuf[m_recvBegin],0x0a,rc));
				if (cr){
					*(cr + 1) = 0;
					std::shared_ptr<TextPacket> pkt(GCC_NEW TextPacket(&m_recvBuf[m_recvBegin]));
			
					m_InList.push_front(pkt);
					packetSize = cr - &m_recvBuf[m_recvBegin];
					bPktReceived = true;

					processedData += packetSize;
					newData -= packetSize;
					m_recvBegin += packetSize;

				}
				else{
					break;
				}
			}
		}
	}

	g_pSocketManager->AddToOutBound(rc);
	m_recvOfs = newData;

	if (bPktReceived){
		if (m_recvOfs == 0){
			m_recvBegin = 0;
		}
		else if (m_recvBegin+m_recvOfs+MAX_PACKET_SIZE > RECV_BUFFER_SIZE){
			// more than excpected save for the next round
			int leftover = m_recvOfs;
			memcpy(m_recvBuf,&m_recvBuf[m_recvBegin],m_recvOfs);
			m_recvBegin = 0;
		}
	}
}


BaseSocketManager::BaseSocketManager(){
	m_outBound=0;
	m_inBound=0;
	m_MaxOpenSockets=0;
	m_Subnet=0;
	m_SubnetMask=0xffffffff;

	g_pSocketManager = this;
	ZeroMemory(&m_WsaData, sizeof(WSADATA));
}

bool BaseSocketManager::Init(){
	if (WSAStartup(0x0202, &m_WsaData) == 0){
		return true;
	}
	else{
		GCC_ERROR("WSAStartup failure");
		return false;
	}
}

void BaseSocketManager::Shutdown(){
	while (!m_SockList.empty()){
		delete *m_SockList.begin();
		m_SockList.pop_front();
	}
	WSACleanup();
}

int BaseSocketManager::AddSocket(NetSocket *socket){
	socket->m_id = m_NextSocketId;
	m_SockMap[m_NextSocketId] = socket;
	++m_NextSocketId;
	m_SockList.push_front(socket);
	if (m_SockList.size() > m_MaxOpenSockets){
		++m_MaxOpenSockets;
	}
	return socket->m_id;
}

void BaseSocketManager::RemoveSocket(NetSocket *socket){
	m_SockList.remove(socket);
	m_SockMap.erase(socket->m_id);
	SAFE_DELETE(socket);
}

NetSocket *BaseSocketManager::FindSocket(int sockId){
	SocketIdMap::iterator i = m_SockMap.find(sockId);
	if (i == m_SockMap.end()){
		return NULL;
	}
	// ID/VALUE first=id second=value
	return (*i).second;
}


bool BaseSocketManager::Send(int sockId, std::shared_ptr<IPacket> packet){
	NetSocket *sock = FindSocket(sockId);
	if (!sock){
		return false;
	}
	sock->Send(packet);
	return true;
}

void BaseSocketManager::DoSelect(int pauseMicroSecs, int handleInput){
	timeval tv;
	tv.tv_sec = 0;
	tv.tv_usec = pauseMicroSecs;
	fd_set inp_set, out_set, exc_set;
	int maxdesc;

	FD_ZERO(&inp_set);
	FD_ZERO(&out_set);
	FD_ZERO(&exc_set);

	maxdesc = 0;

	//set all for the select
	for (SocketList::iterator i = m_SockList.begin(); i != m_SockList.end(); ++i){
		NetSocket *pSock = *i;
		if ((pSock->m_delete_flag & 1) || pSock->m_sock == INVALID_SOCKET){
			continue;
		}
		if (handleInput){
			FD_SET(pSock->m_sock, &inp_set);
		}

		FD_SET(pSock->m_sock, &exc_set);

		if (pSock->VHasOutput()){
			FD_SET(pSock->m_sock, &out_set);
		}

		if ((int)pSock->m_sock > maxdesc){
			maxdesc = (int)pSock->m_sock;
		}
	}
	
	int selRet = 0;
	// do the select
	selRet = select(maxdesc + 1, &inp_set, &out_set, &exc_set, &tv);
	if (selRet == SOCKET_ERROR){
		GCC_ERROR("Error in DoSelect");
		return;
	}
	// handle in, out, exception
	if (selRet){
		for (SocketList::iterator i = m_SockList.begin(); i != m_SockList.end(); ++i){
			NetSocket *pSock = *i;
			if ((pSock->m_delete_flag & 1) || pSock->m_sock == INVALID_SOCKET){
				continue;
			}

			if (FD_ISSET(pSock->m_sock, &exc_set)){
				pSock->HandleException();
			}
			if (!(pSock->m_delete_flag & 1) && FD_ISSET(pSock->m_sock, &out_set)){
				pSock->VHandleOutput();
			}
			if (!(pSock->m_delete_flag & 1) && FD_ISSET(pSock->m_sock, &inp_set)){
				pSock->VHandleInput();
			}
		}
	}

	unsigned int timeNow = timeGetTime();

	// handle deleting any socket
	SocketList::iterator i = m_SockList.begin();
	while (i != m_SockList.end()){
		NetSocket *pSock = *i;
		if (pSock->m_timeout && pSock->m_timeout < timeNow){
			pSock->VTimeOut();
		}

		if (pSock->m_delete_flag & 1){
			switch (pSock->m_delete_flag){
				case 1:
					g_pSocketManager->RemoveSocket(pSock);
					i = m_SockList.begin();
					continue;
					//break;
				case 3:
					pSock->m_delete_flag = 2;
					if (pSock->m_sock != INVALID_SOCKET){
						closesocket(pSock->m_sock);
						pSock->m_sock = INVALID_SOCKET;
					}
					break;
			}
		}
		++i;
	}
}

bool BaseSocketManager::IsInternal(unsigned int ipaddr){
	if (!m_SubnetMask){
		return false;
	}

	if ((ipaddr & m_SubnetMask) == m_Subnet){
		return false; // not true ? do test to check 
	}

	return true;
}

unsigned int BaseSocketManager::GetHostByName(const std::string &hostName){
	struct hostent *pHostEnt = gethostbyname(hostName.c_str());
	struct sockaddr_in tmpSockAddr;

	if (pHostEnt == NULL){
		GCC_ERROR("Error occured");
		return 0;
	}

	memcpy(&tmpSockAddr.sin_addr, pHostEnt->h_addr_list[0], pHostEnt->h_length);

	return ntohl(tmpSockAddr.sin_addr.s_addr);
}


const char *BaseSocketManager::GetHostByAddr(unsigned int ip){
	static char host[256];

	int netip = htonl(ip);
	struct hostent *pHostEnt = gethostbyaddr((const char *)&netip, 4, PF_INET);

	if (pHostEnt){
		strcpy_s(host, 256, pHostEnt->h_name);
		return host;
	}

	return NULL;
}


int getHTTPRequestMethod(char const* const message){
	if (message == 0 || strlen(message) < 3){
		return -1;
	}
	if (!strncmp(message, "GET", 3)){
		return HTTPMessage::request_method::RM_GET;
	}else if (!strncmp(message, "POST", 4)){
		return HTTPMessage::request_method::RM_POST;
	}
	return -1;
}

const char const*getHTTPRequestBody(char const* const message){
	// static must be thread safe in concurrent mode
	static char body[64];
	
	if (message == 0){
		return NULL;
	}

	// isolate payload from full message
	for (int i = strlen(message) - 2; i > 0; --i){
		if (message[i] == '\n' && message[i - 1] == '\r'){
			int len = strlen(message) - i > bodysizemax ? bodysizemax : strlen(message) - i;
			strncpy_s(body, len, &message[i] + 1, strlen(message) - i);
			body[strlen(body)] = '\0';
			break;
		}
	}

	return body;
}


/**
* This function should be part of the AI Actor when Move event is received
*/
const char* buildNewCoordHttpMessage(){
	// calculate new coord random (great AI !)
	char xbuf[4];
	char ybuf[4];

	int random = rand();
	int x = random % 512;// TODO: (max X) 512 must be init by first HTTP message
	int y = random % 480;// TODO: (max Y) 480 must be init by first HTTP message

	_itoa_s(y, ybuf, 10);
	_itoa_s(x, xbuf, 10);
	char data[64];
	sprintf_s(data, 64, "x=%s;y=%s", xbuf, ybuf);

	HTTPResponseBuilder::GetSingleton().CreateHttpMessage();
	HTTPResponseBuilder::GetSingleton().SetMessageBody(data);
	HTTPResponseBuilder::GetSingleton().SetMessageResponse(HTTPMessage::reponse_code_t::OK);
	HTTPResponseBuilder::GetSingleton().BuildHttpMessage();

	const char* httpMessage = HTTPResponseBuilder::GetSingleton().GetHttpMessage();

	return httpMessage;
}

//Event socket
void RemoteEventSocket::VHandleInput(){
	NetSocket::VHandleInput();
	// get packets and make something with it
	while (!m_InList.empty()){
		std::shared_ptr<IPacket> packet = *m_InList.begin();
		m_InList.pop_front();
		if (!strcmp(packet->VGetType(), BinaryPacket::g_Type))
		{
			printf("binary message not handeled yet\n");
			// code from book for practice
			const char* buf = packet->VGetData();
			int size = static_cast<int>(packet->VGetSize());

			std::istrstream in(buf + sizeof(u_long), (size - sizeof(u_long)));

			int type;
			in >> type;
			switch (type){
			case NetMsg_Event:
				printf("NetMsg_Event\n");//TODO p688
				break;
			case NetMsg_PlayerLoginOk:
				printf("NetMsg_PlayerLoginOk\n");//TODO p688
				break;
			default:
				printf("Unkown message type\n");
				GCC_ERROR("Unkown message type");
			}
		}
		else if (!strcmp(packet->VGetType(), HTTPPacket::g_Type))
		{
			const char *buf = packet->VGetData();
			int httpMethod = getHTTPRequestMethod(buf);
			switch (httpMethod){
				case HTTPMessage::request_method::RM_POST:
				{
					// extract body information (from last but one \r\n to last \r\n) to generate a specific Event
					const char *payload = getHTTPRequestBody(buf);
					std::istrstream in(payload, strlen(payload));
					EventType eventType;
					in >> eventType;
					IEventDataPtr pEvent(CREATE_EVENT(eventType));
					if (pEvent)
					{
						pEvent->VDeserialize(in);
						printf("POST %ld\n",pEvent->VGetEventType());
						//IEventManager::Get()->VQueueEvent(pEvent); // TODO MessageEventManager
						SendHttpResponse(HTTPMessage::reponse_code_t::OK);
					}
					else
					{
						SendHttpResponse(HTTPMessage::reponse_code_t::SERVERNOTAVAILABLE);
						const int max = 16;
						char str[max];
						memset(str, 0, max);
						_itoa_s(eventType, str, max, 10);
						GCC_ERROR("ERROR Unknown event type from remote: 0x"+std::string(str));
					}
					
					break;
				}
				case HTTPMessage::request_method::RM_GET:
				{
					// ******************************************
					// This code should move to the game AI actor 
					// that would trigger a move event back to the client
					// when a MOVE event is received in POST message
					// IA reacts by moving randomly (Which is the blue player in client)
				    // For now the GET with whatever in it will do the trick
					// ******************************************
					printf("GET \n");
					const char *httpMessage = buildNewCoordHttpMessage();
					IPacket *packetBack = GCC_NEW HTTPPacket(httpMessage);
					std::shared_ptr<IPacket> ipBack(packetBack);
					Send(ipBack);
					break;
				}
				default:
				{
					printf("Unkown message type\n");
					GCC_ERROR("Unkown message type");
					SendHttpResponse(HTTPMessage::reponse_code_t::SERVERNOTAVAILABLE);
				}
			}
		}
		else{
			printf("text message not implemented yet\n");
		}		
	}
}

void NetSocket::SendHttpResponse(HTTPMessage::reponse_code_t response_code){
	HTTPResponseBuilder::GetSingleton().CreateHttpMessage();
	HTTPResponseBuilder::GetSingleton().SetMessageResponse(response_code);
	HTTPResponseBuilder::GetSingleton().BuildHttpMessage();

	char* httpMessage = HTTPResponseBuilder::GetSingleton().GetHttpMessage();

	IPacket *packetBack = GCC_NEW HTTPPacket(httpMessage);
	std::shared_ptr<IPacket> ipBack(packetBack);
	Send(ipBack);
}


//NetListenSocket
void NetListenSocket::Init(int portnum){
	struct sockaddr_in sa;
	int value = 1;

	if ((m_sock = socket(AF_INET, SOCK_STREAM, 0)) == INVALID_SOCKET){
		GCC_ERROR("NetListenSocket error: Init failed to handle socket");
	}

	//set socket reuse
	if (setsockopt(m_sock, SOL_SOCKET, SO_REUSEADDR, (char*)&value, sizeof(value)) == SOCKET_ERROR){
		closesocket(m_sock);
		m_sock = INVALID_SOCKET;
		GCC_ERROR("NetListenSocket error: Init failed to set socket option");
	}

	srand(time(NULL));

	memset(&sa, 0, sizeof(sa));
	sa.sin_family = AF_INET;
	sa.sin_addr.s_addr = ADDR_ANY;
	sa.sin_port = htons(portnum);
	// bind to port
	if (bind(m_sock, (struct sockaddr *)&sa, sizeof(sa)) == SOCKET_ERROR){
		closesocket(m_sock);
		m_sock = INVALID_SOCKET;
		GCC_ERROR("NetListenSocket error: Init failed to bind port");
	}
	// else accept() blocks in odd circumstances
	SetBlocking(false);

	if (listen(m_sock, 256) == SOCKET_ERROR){
		closesocket(m_sock);
		m_sock = INVALID_SOCKET;
		GCC_ERROR("NetListenSocket error: Init failed to listen");
	}
	printf_s("Listen on %d\n", portnum);
	
	port = portnum;
}

SOCKET NetListenSocket::AcceptConnection(unsigned int *pAddr){
	SOCKET new_sock;
	struct sockaddr_in sock;
	int size = sizeof(sock);

	if ((new_sock = accept(m_sock,(struct sockaddr *)&sock,&size))==INVALID_SOCKET){
		return INVALID_SOCKET;
	}

	if (getpeername(new_sock, (struct sockaddr *)&sock, &size)== SOCKET_ERROR){
		closesocket(m_sock);
		return INVALID_SOCKET;
	}
	*pAddr = ntohl(sock.sin_addr.s_addr);
	const char *ip = g_pSocketManager->GetHostByAddr(*pAddr);
	printf("Accepted from %s\n",ip);

	return new_sock;
}

// CLIENT
int ClientSocketManager::Connect(){
	
	int idSock;
	if (!BaseSocketManager::Init()){
		return false;
	}

	RemoteEventSocket *pSocket = GCC_NEW RemoteEventSocket;

	if (!pSocket->Connect(GetHostByName(m_hostname), m_port)){
		SAFE_DELETE(pSocket);
		return false;
	}
	idSock = AddSocket(pSocket);
	return idSock;
}

// THEN SERVER
void GameServerListenSocket::VHandleInput(){
	unsigned int theipaddr;
	SOCKET new_sock = AcceptConnection(&theipaddr);

	int value = 1;
	setsockopt(new_sock, SOL_SOCKET, SO_DONTLINGER, (char *)&value, sizeof(value));

	if (new_sock != INVALID_SOCKET){
		RemoteEventSocket *sock = GCC_NEW RemoteEventSocket(new_sock, theipaddr);
		int sockId = g_pSocketManager->AddSocket(sock);

		int ipAddress = g_pSocketManager->GetIpAddress(sockId);		
		//std::shared_ptr<EvtData_Remote_Client> pEvent... p685 TODO
 	}
}

int BaseSocketManager::GetIpAddress(int sockId)
{
	NetSocket *socket = FindSocket(sockId);
	if (socket)
	{
		return socket->GetIpAddress();
	}
	else
	{
		return 0;
	}
}

void GameServerListenSocket::VRegisterNetworkEvents(void)
{
	REGISTER_EVENT(EventData_MoveActor);
	REGISTER_EVENT(EventData_EndActor);
	REGISTER_EVENT(EventData_ScoreActor);
}

//HTTP Message routines
const char* HTTPMessage::m_head = "HTTP/1.1";
const char* HTTPMessage::m_dateOrigin = "Date: ";
const char* HTTPMessage::m_serverName = "Server: Musimos";
const char* HTTPMessage::m_lastModified = "Last-Modified: ";
const char* HTTPMessage::m_contentType = "Content-Type: text/html";
const char* HTTPMessage::m_contentLength = "Content-Length: ";
const char* HTTPMessage::m_acceptRanges = "Accept-Ranges: bytes";
const char* HTTPMessage::m_connection = "Connection: close";
const char* HTTPMessage::m_accessControlAllowOrigin = "Access-Control-Allow-Origin: *";

void HTTPResponseBuilder::CreateHttpMessage(){
	_httpResult = new HTTPMessageResponse();
}

void HTTPResponseBuilder::SetMessageBody(char* data){
	_httpResult->SetHttpData(data);
}

void HTTPResponseBuilder::SetMessageResponse(HTTPMessage::reponse_code_t response){
	_httpResult->SetHttpResponseCode(response);
}


void HTTPResponseBuilder::BuildHttpMessage(){
	std::string str;
	std::string str_test;

	time_t rawtime;
	struct tm timeinfo;
	char buffer[80];
	char bufferlen[10];

	str.append(_httpResult->m_head);
	str.append(" ");
	switch (_httpResult->getResponseCode()){
		case HTTPMessageResponse::OK:
			str.append("200 OK");
			break;
		case HTTPMessageResponse::NOTFOUND:
			str.append("404 NOT FOUND");
			break;
		default:
			str.append("500 Internal Server Error");
	}
	str.append(END_OF_LINE);
	str.append(_httpResult->m_dateOrigin);
	//date and time
	time(&rawtime);
	localtime_s(&timeinfo,&rawtime);
	//i.e "Thu, 19 Feb 2015 12:27:04 GMT\n"
	strftime(buffer, 80, "%a, %d %b %Y %H:%M:%S %Z", &timeinfo);
	str.append(buffer);

	str.append(END_OF_LINE);
	str.append(_httpResult->m_serverName);
	str.append(END_OF_LINE);
	str.append(_httpResult->m_lastModified);
	str.append(buffer);
	str.append(END_OF_LINE);
	str.append(_httpResult->m_contentType);
	str.append(END_OF_LINE);
	str.append(_httpResult->m_contentLength);
	if (_httpResult->GetHttpMessageBody() == 0){
		bufferlen[0] = '0';
		bufferlen[1] = '\0';
	}
	else{
		_itoa_s(strlen(_httpResult->GetHttpMessageBody()), bufferlen, 10);
	}
	str.append(bufferlen);
	str.append(END_OF_LINE);
	str.append(_httpResult->m_acceptRanges);
	str.append(END_OF_LINE);
	str.append(_httpResult->m_connection);
	str.append(END_OF_LINE);
	str.append(_httpResult->m_accessControlAllowOrigin);
	str.append(END_OF_LINE);
	str.append(END_OF_LINE);
	if (_httpResult->GetHttpMessageBody() != 0){
		str.append(_httpResult->GetHttpMessageBody());
	}
	str.append("\0");

	std::vector<char> writable(str.begin(), str.end());
	writable.push_back('\0');
	
	_httpResult->SetHttpMessage(str.c_str());
}

void HTTPMessage::SetHttpMessage(const char* message){
	_httpMessage = GCC_NEW char[512];
	strncpy_s(_httpMessage, 512, message, strlen(message));
}

// not in concurrency mode yet, so I can use safely the singleton
HTTPResponseBuilder& HTTPResponseBuilder::GetSingleton()
{
	static HTTPResponseBuilder* pSingletonInstance = new HTTPResponseBuilder();
	return *pSingletonInstance;
}
