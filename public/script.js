let messageCount = 0;
let selectedFile = null;

function scrollToBottom() {
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendMessage(sender, message, id = null) {
    const messageHtml = `
      <div class="message ${sender}">
        <div class="msg-body" ${id ? `id="${id}"` : ""}>${message}</div>
      </div>
    `;
    document.getElementById("chatMessages").insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

document.getElementById("send").addEventListener("click", sendMessage);

function sendMessage() {
    const userInput = document.getElementById("text").value.trim();
    const formData = new FormData();

    // Append the file if selected
    if (selectedFile) {
        formData.append("file", selectedFile);
    }

    // Append the user input message
    if (userInput) {
        formData.append("message", userInput);
        appendMessage("user", userInput);
        document.getElementById("text").value = ""; // Clear input
    } else {
        return; // If no message, do not proceed
    }

    // Send the message and file to the server
    fetch("/webhook", {
        method: "POST",
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.response) {
                // If the server responds with a message
                appendMessage("model", data.response);
            } else if (data.file_url) {
                // If a file URL is returned, display the image
                appendMessage("model", `<img src="${data.file_url}" alt="Uploaded Image" style="max-width: 100%; height: auto;" />`);
            } else {
                appendMessage("model", `Error: ${data.error}`);
            }
            scrollToBottom();
        })
        .catch((error) => {
            appendMessage("model", "Failed to connect to server.");
            console.error("Error:", error);
            scrollToBottom();
        });
}

function fetchBotResponse(formData) {
    fetch("/get", {
        method: "POST",
        body: formData,
    })
        .then((response) => response.text())
        .then((data) => displayBotResponse(data))
        .catch(() => displayError())
        .finally(() => {
            selectedFile = null;
        });
}

function displayBotResponse(data) {
    const botMessageId = `botMessage-${messageCount++}`;
    appendMessage("model", "", botMessageId);

    const botMessageDiv = document.getElementById(botMessageId);
    botMessageDiv.textContent = "";

    let index = 0;
    const interval = setInterval(() => {
        if (index < data.length) {
            botMessageDiv.textContent += data[index++];
        } else {
            clearInterval(interval);
        }
    }, 30);
}

function displayError() {
    appendMessage("model", "Failed to fetch a response from the server.");
}

function attachEventListeners() {
    const sendButton = document.getElementById("send");
    const inputField = document.getElementById("text");
    const attachmentButton = document.getElementById("attachment");
    const fileInput = document.getElementById("fileInput");
    const minimizeButton = document.getElementById("minimizeBtn");
    const chatContainer = document.getElementById("chatContainer");
    const minimizedIcon = document.getElementById("minimizedIcon");

    sendButton.addEventListener("click", sendMessage);

    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    attachmentButton.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", (event) => {
        selectedFile = event.target.files[0];
        appendMessage("user", `Selected File: ${selectedFile.name}`);
    });

    // Minimize button functionality
    minimizeButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering the chat container click
        const chatContainer = document.getElementById("chatContainer");

        // Toggle the minimized state
        if (chatContainer.classList.contains("minimized")) {
            chatContainer.classList.remove("minimized");
            minimizedIcon.style.display = "none"; // Hide the icon when expanded
        } else {
            chatContainer.classList.add("minimized");
            minimizedIcon.style.display = "block"; // Show the icon when minimized
        }
    });

    // Maximize the chat container when clicked on minimized state (circle)
    minimizedIcon.addEventListener("click", () => {
        const chatContainer = document.getElementById("chatContainer");
        if (chatContainer.classList.contains("minimized")) {
            // Maximize the chat container when clicked
            chatContainer.classList.remove("minimized");
            minimizedIcon.style.display = "none"; // Hide the icon
        }
    });
}

document.addEventListener("DOMContentLoaded", attachEventListeners);
