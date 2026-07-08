const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

// ⚠️ YOUR API KEY (Keep this secret in production!)
const API_KEY = "AQ.Ab8RN6IoPHH96Fz26PTot86P5A73JD-97-AeI6uLIr37N8aHXw";

// Updated to the stable 1.5 Flash model endpoint
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

let userMessage = null;
let isResponseGenerating = false;

// Create message element
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Typing effect
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    if (!text) text = "No response.";

    const words = text.split(" ");
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        textElement.innerHTML += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];

        const icon = incomingMessageDiv.querySelector(".icon");
        if (icon) icon.classList.add("hide");

        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;

            if (icon) icon.classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML);
        }

        chatList.scrollTo(0, chatList.scrollHeight);
    }, 40);
};

// API Call - FIXED: Added ?key= to the URL
const generateAPIResponse = async (incomingMessageDiv, promptText) => {
    const textElement = incomingMessageDiv.querySelector(".text");

    try {
        // CRITICAL FIX: The API Key must be appended to the URL as a query parameter
        const REQUEST_URL = `${API_URL}?key=${API_KEY}`;

        const response = await fetch(REQUEST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: String(promptText || "") }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("API Error:", data);
            throw new Error(data?.error?.message || "API request failed");
        }

        const apiResponse =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response received.";

        showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    } catch (error) {
        console.error("Fetch Error:", error);
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
};

// Loading animation
const showLoadingAnimation = (promptText) => {
    const html = `
        <div class="message-content">
            <img src="images/gemini.svg" class="avatar">
            <p class="text"></p>
            <div class="loading-indicator">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
        </div>
        <span onclick="copyMessage(this)" class="icon material-symbols-outlined">content_copy</span>
    `;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0, chatList.scrollHeight);

    generateAPIResponse(incomingMessageDiv, promptText);
};

// Copy message
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";
    setTimeout(() => {
        copyIcon.innerText = "content_copy";
    }, 1000);
};

// Send message
const handleOutgoingChat = () => {
    const inputField = typingForm.querySelector(".typing-input");
    userMessage = inputField.value.trim() || userMessage;

    if (!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;
    const currentPrompt = userMessage;

    const html = `
        <div class="message-content">
            <img src="images/user.jpg" class="avatar">
            <p class="text">${currentPrompt}</p>
        </div>
    `;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();
    userMessage = null;

    chatList.scrollTo(0, chatList.scrollHeight);
    document.body.classList.add("hide-header");

    setTimeout(() => showLoadingAnimation(currentPrompt), 300);
};

// Load saved chats
const loadLocalStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = localStorage.getItem("themeColor") === "light_mode";

    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", !!savedChats);
    chatList.scrollTo(0, chatList.scrollHeight);
};

// Theme toggle
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete chat
deleteChatButton.addEventListener("click", () => {
    if (confirm("Delete all chats?")) {
        localStorage.removeItem("savedChats");
        loadLocalStorageData();
    }
});

// Suggestions
suggestions.forEach((suggestion) => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// Submit form
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});

// Init
loadLocalStorageData();
