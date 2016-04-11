#include "stdafx.h"
#include <server.h>
#include "EventManager.h"
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

	// creation of singleton with 2nd parameter
	EventManager *eventManager = GCC_NEW EventManager("EventManager", true);

	bool listen = true;

	while (listen){
		server->VHandleInput();
		m_pBaseSocketManager->DoSelect(10);
		eventManager->VUpdate(1000);
	}

	return 0;
}
