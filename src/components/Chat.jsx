"use client"
import { useEffect, useState } from "react"
import { BsFillChatSquareTextFill } from "react-icons/bs"
import { IoClose } from "react-icons/io5"

const Chat = ({ isLive, sendMessage, messages, setMessages, socketId, userName }) => {
  const [chatMessage, setChatMessage] = useState("")
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [show, setShow] = useState(false)

  // Increment unread count only for other people's messages when chat is closed
  useEffect(() => {
    if (
      !show &&
      messages.length > 0 &&
      messages[messages.length - 1].socketId !== socketId
    ) {
      setUnreadMessages(prev => prev + 1)
    }
  }, [messages, show, socketId])

  // Reset unread when chat is opened
  useEffect(() => {
    if (show) {
      setUnreadMessages(0)
    }
  }, [show])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = chatMessage.trim()
    if (!trimmed) return

    // Immediately show your own message in chat
    const newMessage = {
      message: trimmed,
      socketId,
      userName,
    }
    setMessages(prev => [...prev, newMessage])

    sendMessage(trimmed) // still send to server
    setChatMessage("")
  }

  return (
    <div className="relative">
      {isLive && (
        <button
          onClick={() => setShow(!show)}
          className="bg-secondary hover:bg-opacity-70 text-white font-bold py-2 px-4 rounded-full relative"
          aria-label="Toggle Chat"
        >
          <BsFillChatSquareTextFill className="text-2xl text-primary" />
          {unreadMessages > 0 && (
            <div className="absolute -top-1 -right-1 text-[12px] text-white font-bold bg-red-400 px-1 rounded-full">
              {unreadMessages}
            </div>
          )}
        </button>
      )}

      {show && (
        <div className="fixed top-4 right-4 z-50 w-80 max-w-[90vw] max-h-[80vh]">
          <div className="overflow-hidden bg-[#2D1B69] rounded-xl shadow-2xl border border-[#8B5CF6]">
            <div className="text-gray-200 rounded-t-lg p-3 border-b-2 border-tertiary bg-primary">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Chat</h1>
                <button
                  onClick={() => setShow(false)}
                  className="hover:bg-opacity-70 text-white py-1 px-2 rounded-full"
                  aria-label="Close Chat"
                >
                  <IoClose size={24} />
                </button>
              </div>
            </div>

            <div className="h-[50vh] overflow-y-auto p-3 hideScroll">
              <div className="flex flex-col space-y-3">
                {messages.map((message, index) =>
                  message.socketId === socketId ? (
                    <div key={index} className="flex justify-end">
                      <div className="max-w-[80%] py-2 px-3 bg-primary rounded-bl-2xl rounded-tl-2xl rounded-tr-xl text-white text-sm">
                        {message.message}
                      </div>
                    </div>
                  ) : (
                    <div key={index} className="flex flex-col items-start">
                      <p className="text-xs text-gray-400 mb-1 ml-2">
                        {message.userName}
                      </p>
                      <div className="max-w-[80%] py-2 px-3 bg-tertiary rounded-br-2xl rounded-tr-2xl rounded-tl-xl text-white text-sm">
                        {message.message}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-[#8B5CF6] bg-[#2D1B69]"
            >
              <div className="flex gap-2">
                <input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-[#1E1B4B] text-white placeholder:text-gray-400 py-2 px-3 rounded-lg border border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#A855F7] text-sm"
                  type="text"
                  placeholder="Type your message..."
                />
                <button
                  type="submit"
                  className="bg-[#A855F7] hover:bg-[#9333EA] text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
