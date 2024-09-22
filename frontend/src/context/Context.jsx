import {createContext, useEffect, useRef, useState} from "react";
// import runChat from "../services/engine";
import {fetchEventSource} from "@microsoft/fetch-event-source";
import EventSource from "react-native-sse";
import React from 'react';

const OPENAI_BASE_URL = 'http://127.0.0.1:8000/v1'
const AISQUAD_BASE_URL = 'http://127.0.0.1:8500'

export const Context = createContext();

const ContextProvider = (props) => {
    const [msgHistory, setMsgHistory] = useState([]);
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("openai");
    const [showResult, setShowResult] = useState(false)
    const [loading, setLoading] = useState(false)
    const [resultData, setResultData] = useState("")
    const [stream, setStream] = useState(false)
    const chatContainerRef = useRef(null);
    const shouldScrollRef = useRef(true);

    useEffect(() => {
        if (shouldScrollRef.current && chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [msgHistory]);

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const {scrollTop, scrollHeight, clientHeight} = chatContainerRef.current;
            const atBottom = scrollHeight - scrollTop - clientHeight < 1;
            shouldScrollRef.current = atBottom;
        }
    };

    const updateMsgHistory = (updater) => {
        setMsgHistory(prevMsgHistory => {
            const updatedHistory = updater(prevMsgHistory);
            return updatedHistory;
        });
    };

    const chat_openai = async (msgHistory) => {
        // add an empty prompt to kick-start

        const api_headers = {
            "Content-Type": "application/json",
        }

        const data = {
            model: 'gpt-4o',
            messages: msgHistory.slice(0, -1),
            stream: true,
        };


        const es = new EventSource(
            OPENAI_BASE_URL + '/chat/completions',
            {
                headers: api_headers,
                method: "POST",
                body: JSON.stringify(data),
                pollingInterval: 0 //set pollingInterval to 0 to disable reconnections
            },
        )

        es.addEventListener("open", () => {
            console.log("connection open")
            //reset timeout
            // clearTimeout(timeoutID)
            // timeoutID = setTimeout(() => handleTimeout(es), TIMEOUT_DURATION)
            //resetTimeout()
        })  //Reset the timeout to 0

        es.addEventListener("error", (error) => {
            console.log(error)
            //     setLoading(false)
            //     setError("Failed to connect. Please check your connection and try again.");
            //     clearTimeout(timeoutID);
        })

        // let eventCounter = 0
        es.addEventListener("message", (event) => {
            console.log(event.data)
            if (event.data !== "[DONE]") {
                const data = JSON.parse(event.data);
                // clearTimeout(timeoutID);

                //keep track of the message count
                // eventCounter++
                if (data.choices[0]?.delta?.content) {
                    let content = data.choices[0].delta.content;

                    setMsgHistory(prevMsgHistory => [
                        ...prevMsgHistory.slice(0, -1),
                        {
                            role: "assistant",
                            content: prevMsgHistory[prevMsgHistory.length - 1].content + content,
                        }
                    ])
                } else {
                    setStream(false)
                }
                // timeoutID = setTimeout(() => handleTimeout(es), TIMEOUT_DURATION);
            } else {
                console.log("connection time out")
                setStream(false)
                // clearTimeout(timeoutID);
            }
        })
    }

    const chat_aisquad = async (msgHistory) => {
        // add an empty prompt to kick start

        const api_headers = {
            "Content-Type": "application/json",
        }

        const data = {
            // this must be human msg TODO
            task: msgHistory[msgHistory.length - 1].content
        };


        const es = new EventSource(
            AISQUAD_BASE_URL + '/run',
            {
                headers: api_headers,
                method: "POST",
                body: JSON.stringify(data),
                pollingInterval: 0 //set pollingInterval to 0 to disable reconnections
            },
        )

        es.addEventListener("open", () => {
            console.log("connection open")
            //reset timeout
            // clearTimeout(timeoutID)
            // timeoutID = setTimeout(() => handleTimeout(es), TIMEOUT_DURATION)
            //resetTimeout()
        })  //Reset the timeout to 0

        es.addEventListener("error", (error) => {
            console.log(error)
            //     setLoading(false)
            //     setError("Failed to connect. Please check your connection and try again.");
            //     clearTimeout(timeoutID);
        })

        // let eventCounter = 0
        es.addEventListener("message", (event) => {
            console.log(event.data)
            if (event.data !== "[DONE]") {
                const data = JSON.parse(event.data);
                // clearTimeout(timeoutID);

                //keep track of the message count
                // eventCounter++
                if (data?.content) {
                    setMsgHistory(prevMsgHistory => [
                        ...prevMsgHistory,
                        {
                            role: "assistant",
                            content: data.content,
                            to_agent: data.to_agent,
                            from_agent: data.from_agent,
                        }
                    ])
                } else {
                    setStream(false)
                }
                // timeoutID = setTimeout(() => handleTimeout(es), TIMEOUT_DURATION);
            } else {
                console.log("stream done")
                setStream(false)
                // clearTimeout(timeoutID);
            }
        })
    }


    useEffect(() => {
        if (stream) {
            if (mode === "openai") {
                chat_openai(msgHistory)
            } else if (mode === "aisquad") {
                chat_aisquad(msgHistory)
            }
        }
    }, [stream]);

    const onSent = async (prompt) => {
        setResultData("")
        setLoading(true)
        setShowResult(true)
        setLoading(false);
        if (mode === "openai") {
            updateMsgHistory(prevMsgHistory => [
                ...prevMsgHistory,
                {
                    role: "user",
                    content: prompt,
                },
                {
                    role: "assistant",
                    content: "",
                }
            ]);
        } else if (mode === "aisquad") {
            updateMsgHistory(prevMsgHistory => [
                ...prevMsgHistory,
                {
                    role: "user",
                    content: prompt,
                    from_agent: "human",
                    to_agent: "Secretary_Thu",
                },
            ]);
        }
        setStream(true);
        setInput(""); // Clear the input field after sending a message
    }

const newChat = async () => {
    setLoading(true); // Show loading indicator
    setShowResult(false); // Hide results

    // Perform any required clean-up for ongoing streams
    setStream(false);

    // Check if the mode is "openai" and clear the chat state if necessary
    if (mode === "openai") {
        try {
            // Make a POST request to clear the state on the server
            const response = await fetch(`${OPENAI_BASE_URL}/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Cleared OPENAI state:', data);
        } catch (error) {
            console.error('Error clearing OPENAI state:', error);
        }
    }

    // Clear local chat history
    setMsgHistory([]);

    setLoading(false); // Hide loading indicator
};


    const toggleMode = () => {
        setMode((prevMode) => (prevMode === "openai" ? "aisquad" :
            "openai"));
    };

    const contextValue = {
        mode,
        msgHistory,
        setMsgHistory: updateMsgHistory,
        onSent,
        showResult,
        loading,
        resultData,
        input,
        setInput,
        chatContainerRef,
        handleScroll,
        toggleMode,
        newChat,
    }

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>
    )
}

export default ContextProvider