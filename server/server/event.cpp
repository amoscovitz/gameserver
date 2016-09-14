#include "event.h"
#include "server.h"

const EventType EventData_CreateActor::sk_EventType(0x1EBE0D02);
const EventType EventData_MoveActor::sk_EventType(0x1EBE0D01);
const EventType EventData_GetActor::sk_EventType(0x1EBE0D03);
const EventType EventData_GetNewPositionActor::sk_EventType(0x1EBE0D04);
const EventType EventData_EndActor::sk_EventType(0x8EDE964A);
const EventType EventData_ScoreActor::sk_EventType(0xB28347C0);
const EventType EventData_ResponseHTTP::sk_EventType(0xB28347C1);
const EventType EventData_CloseSocketHTTP::sk_EventType(0xB28347C2);

void EventData_ResponseHTTP::BuildMessage() {
		HTTPResponseBuilder::GetSingleton().CreateHttpMessage();
		if (!m_payload.empty()) {
			HTTPResponseBuilder::GetSingleton().SetMessageBody(m_payload.c_str());
		}
		HTTPResponseBuilder::GetSingleton().SetMessageResponse(m_httpResponsCode);
		HTTPResponseBuilder::GetSingleton().BuildHttpMessage();

		const char* httpMessage = HTTPResponseBuilder::GetSingleton().GetHttpMessage();
		m_httpMessage.append(httpMessage);
		m_httpMessage.push_back('\0');
}