#include "stdafx.h"
#include <server.h>
#include <iostream>
#include <vector>


using namespace std;


int _tmain(int argc, _TCHAR* argv[])
{
	cout << "Welcome" << endl;

	BaseSocketManager *m_pBaseSocketManager = GCC_NEW BaseSocketManager();
	m_pBaseSocketManager->Init();
	GameServerListenSocket *server = GCC_NEW GameServerListenSocket(2222);
	server->VRegisterNetworkEvents();

	bool listen = true;

	while (listen){
		server->VHandleInput();
		m_pBaseSocketManager->DoSelect(10);
	}

	return 0;

}
