#pragma once

#include <string>

// in  Msvc/GameCodeStd.h to put in include c++
#if !defined(SAFE_DELETE)
#define SAFE_DELETE(x) if(x) delete x; x=NULL;
#endif

#if defined(_DEBUG)
#       define GCC_NEW new(_NORMAL_BLOCK,__FILE__, __LINE__)
#else
#       define GCC_NEW new
#endif


namespace Logger
{
	// This class is used by the debug macros and shouldn't be accessed externally.
	class ErrorMessenger
	{
		bool m_enabled;

	public:
		ErrorMessenger(void);
		void Show(const std::string& errorMessage, bool isFatal, const char* funcName, const char* sourceFile, unsigned int lineNum);
	};

	// construction; must be called at the beginning and end of the program
	void Init(const char* loggingConfigFilename);
	void Destroy(void);

	// logging functions
	void Log(const std::string& tag, const std::string& message, const char* funcName, const char* sourceFile, unsigned int lineNum);
	void SetDisplayFlags(const std::string& tag, unsigned char flags);
}


// do {}while if used only for brackets in macro to more than 1 statement (to be developed)
#if 1 // ndef NDEBUG
#define GCC_ASSERT(expr) \
		do \
		{ \
			if (!(expr)) \
				{ \
					static Logger::ErrorMessenger* pErrorMessenger = GCC_NEW Logger::ErrorMessenger; \
					pErrorMessenger->Show(#expr, false, __FUNCTION__, __FILE__, __LINE__); \
				} \
		} \
		while (0) \

#define GCC_ERROR(str) \
		do \
		{ \
			static Logger::ErrorMessenger* pErrorMessenger = GCC_NEW Logger::ErrorMessenger; \
			std::string s((str)); \
			pErrorMessenger->Show(s, false, __FUNCTION__, __FILE__, __LINE__); \
		} \
		while (0)\

#else  // NDEBUG is defined
#define GCC_ASSERT(expr) do { (void)sizeof(expr); } while(0) 
#endif

#define END_OF_LINE "\r\n"


