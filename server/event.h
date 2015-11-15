#include "server.h"
#include "template.h"
#include "strstream"
#include "memory"

//---------------------------------------------------------------------------------------------------------------------
// Macro for event registration
//---------------------------------------------------------------------------------------------------------------------
class IEventData;

typedef unsigned long EventType;
typedef std::shared_ptr<IEventData> IEventDataPtr;

extern GenericObjectFactory<IEventData, EventType> g_eventFactory;
#define REGISTER_EVENT(eventClass) g_eventFactory.Register<eventClass>(eventClass::sk_EventType)
#define CREATE_EVENT(eventType) g_eventFactory.Create(eventType)


class IEventData{
public:
	virtual const EventType& VGetEventType(void) const = 0;
	virtual float VGetTimeStamp(void) const = 0;
	virtual void VSerialize(std::ostrstream& out) const = 0;
	virtual void VDeserialize(std::istrstream& in) = 0;

	virtual IEventDataPtr VCopy(void) const = 0;
	virtual const char* GetName(void) const = 0;
};

class BaseEventData : public IEventData{
	const float m_timestamp;

public:
	explicit BaseEventData(const float timeStamp = 0.0f) : m_timestamp(timeStamp){}
	virtual ~BaseEventData(void){}
	virtual const EventType& VGetEventType(void) const = 0;

	float VGetTimeStamp(void) const { return m_timestamp; }
	virtual void VSerialize(std::ostrstream& out) const{}
	virtual void VDeserialize(std::istrstream& in) {}
};



class EventData_MoveActor : public BaseEventData{
	float m_x, m_y;
	int m_actorId;
public:
	static const EventType sk_EventType;

	EventData_MoveActor(void)
	{
		m_x = m_y = 0;
		m_actorId = -1;
	}

	explicit EventData_MoveActor(float x, float y, int actorId) : m_x(x), m_y(y), m_actorId(actorId){
		//
	}

	virtual const EventType& VGetEventType(void) const { return sk_EventType; }

	virtual void VSerialize(std::ostrstream& out) const{
		out << m_x <<" " << m_y << " " << m_actorId;
	}

	virtual void VDeserialize(std::istrstream& in) {
		in >> m_x;
		in >> m_y;
		in >> m_actorId;
	}

	virtual const char* GetName(void) const{
		return "EventData_MoveActor";
	}

	virtual IEventDataPtr VCopy(void) const{
		return IEventDataPtr(GCC_NEW EventData_MoveActor(m_x, m_y, m_actorId));
	}
};

class EventData_EndActor : public BaseEventData{
	int m_actorId;
public:
	static const EventType sk_EventType;

	EventData_EndActor(void)
	{
		m_actorId = -1;
	}

	explicit EventData_EndActor(int actorId) : m_actorId(actorId){
		//
	}

	virtual const EventType& VGetEventType(void) const { return sk_EventType; }

	virtual void VSerialize(std::ostrstream& out) const{
		out << m_actorId;
	}

	virtual void VDeserialize(std::istrstream& in) {
		in >> m_actorId;
	}

	virtual const char* GetName(void) const{
		return "EventData_EndActor";
	}

	virtual IEventDataPtr VCopy(void) const{
		return IEventDataPtr(GCC_NEW EventData_EndActor(m_actorId));
	}
};

class EventData_ScoreActor : public BaseEventData{
	int m_actorId;
	int m_score;
public:
	static const EventType sk_EventType;

	EventData_ScoreActor(void)
	{
		m_actorId = -1;
	}

	explicit EventData_ScoreActor(int score, int actorId) : m_score(score), m_actorId(actorId){
		//
	}

	virtual const EventType& VGetEventType(void) const { return sk_EventType; }

	virtual void VSerialize(std::ostrstream& out) const{
		out << m_score << " " << m_actorId;
	}

	virtual void VDeserialize(std::istrstream& in) {
		in >> m_score;
		in >> m_actorId;
	}

	virtual const char* GetName(void) const{
		return "EventData_ScoreActor";
	}

	virtual IEventDataPtr VCopy(void) const{
		return IEventDataPtr(GCC_NEW EventData_ScoreActor(m_score, m_actorId));
	}


};
