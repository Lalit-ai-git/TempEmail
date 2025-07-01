// Using 1secmail.com API - free and doesn't require API key
const API_DOMAIN = '1secmail.com';
const API_BASE_URL = `https://www.1secmail.com/api/v1/`;

// Global variables
let currentEmail = '';
let timerInterval;
let timeLeft = 600; // 10 minutes in seconds
let emailCheckInterval;
let messageCount = 0;

// DOM elements
const emailAddressElement = document.getElementById('email-address');
const copyBtn = document.getElementById('copy-btn');
const timerElement = document.getElementById('timer');
const extendBtn = document.getElementById('extend-btn');
const inboxElement = document.getElementById('inbox');
const filterSelect = document.getElementById('filter-select');

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    generateNewEmail();
    startTimer();
    setupEventListeners();
}

function generateNewEmail() {
    // Generate random username
    const randomString = Math.random().toString(36).substring(2, 10);
    currentEmail = `${randomString}@${API_DOMAIN}`;
    emailAddressElement.textContent = currentEmail;
    
    // Start checking for new emails
    startEmailCheck();
    
    // Log the email generation
    logEmailGeneration();
}

function logEmailGeneration() {
    // Get client IP using a free service
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            const ip = data.ip;
            const timestamp = new Date().toISOString();
            
            // Create CSV line
            const csvLine = `${timestamp},${currentEmail},${ip}\n`;
            
            // Send to server to save (you'll need to implement this in your backend)
            saveToServer(csvLine);
        })
        .catch(error => {
            console.error('Error getting IP:', error);
            // Save without IP if there's an error
            const timestamp = new Date().toISOString();
            const csvLine = `${timestamp},${currentEmail},unknown\n`;
            saveToServer(csvLine);
        });
}

function saveToServer(data) {
    // In a real implementation, you would send this to your server
    // For CPanel, you might use AJAX to a PHP script that appends to a file
    console.log('Would save to server:', data);
    // Example:
    // fetch('save_log.php', {
    //     method: 'POST',
    //     body: data
    // });
}

function startEmailCheck() {
    // Clear any existing interval
    if (emailCheckInterval) {
        clearInterval(emailCheckInterval);
    }
    
    // Check immediately
    checkForNewEmails();
    
    // Then check every 5 seconds
    emailCheckInterval = setInterval(checkForNewEmails, 5000);
}

async function checkForNewEmails() {
    if (!currentEmail) return;
    
    const [login, domain] = currentEmail.split('@');
    
    try {
        const response = await fetch(`${API_BASE_URL}?action=getMessages&login=${login}&domain=${domain}`);
        const messages = await response.json();
        
        if (messages && messages.length > messageCount) {
            // New messages arrived
            const newMessages = messages.slice(messageCount);
            messageCount = messages.length;
            
            // Fetch full content for each new message
            for (const message of newMessages) {
                await fetchAndDisplayMessage(message.id, login, domain);
            }
        }
    } catch (error) {
        console.error('Error checking for emails:', error);
    }
}

async function fetchAndDisplayMessage(messageId, login, domain) {
    try {
        const response = await fetch(`${API_BASE_URL}?action=readMessage&login=${login}&domain=${domain}&id=${messageId}`);
        const message = await response.json();
        
        displayMessage(message);
    } catch (error) {
        console.error('Error fetching message:', error);
    }
}

function displayMessage(message) {
    // Remove empty inbox message if it exists
    const emptyInbox = inboxElement.querySelector('.empty-inbox');
    if (emptyInbox) {
        emptyInbox.remove();
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message unread';
    
    const date = new Date(message.date);
    const formattedDate = date.toLocaleString();
    
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${message.from}</span>
            <span class="message-time">${formattedDate}</span>
        </div>
        <div class="message-subject">${message.subject}</div>
        <div class="message-body">${message.textBody || message.htmlBody || 'No message content'}</div>
        <div class="message-actions">
            <button class="forward-btn" data-message='${JSON.stringify(message)}'>Forward to my email</button>
        </div>
    `;
    
    // Add to top of inbox
    inboxElement.insertBefore(messageElement, inboxElement.firstChild);
    
    // Add click handler for forward button
    messageElement.querySelector('.forward-btn').addEventListener('click', handleForwardMessage);
    
    // Mark as read after 2 seconds
    setTimeout(() => {
        messageElement.classList.remove('unread');
    }, 2000);
}

function handleForwardMessage(event) {
    const message = JSON.parse(event.target.getAttribute('data-message'));
    
    const userEmail = prompt('Enter your email address to forward this message:');
    if (!userEmail) return;
    
    // In a real implementation, you would send this to your server to handle forwarding
    alert(`Would forward message to ${userEmail}\n\nSubject: ${message.subject}\n\nThis would be implemented with your backend.`);
    
    // Example implementation might look like:
    // fetch('forward_email.php', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         to: userEmail,
    //         subject: `Fwd: ${message.subject}`,
    //         text: message.textBody || 'No message content'
    //     })
    // });
}

function startTimer() {
    updateTimerDisplay();
    
    // Clear any existing interval
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            emailAddressElement.textContent = 'Expired';
            clearInterval(emailCheckInterval);
            showExpiredMessage();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function showExpiredMessage() {
    inboxElement.innerHTML = `
        <div class="empty-inbox">
            <p>This temporary email address has expired. Refresh the page to generate a new one.</p>
        </div>
    `;
}

function setupEventListeners() {
    // Copy email to clipboard
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(currentEmail)
            .then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
            });
    });
    
    // Extend timer
    extendBtn.addEventListener('click', () => {
        timeLeft += 600; // Add 10 minutes
        updateTimerDisplay();
    });
    
    // Filter messages
    filterSelect.addEventListener('change', () => {
        const filterValue = filterSelect.value;
        const messages = inboxElement.querySelectorAll('.message');
        
        messages.forEach(message => {
            if (filterValue === 'all') {
                message.style.display = 'block';
            } else if (filterValue === 'unread') {
                if (message.classList.contains('unread')) {
                    message.style.display = 'block';
                } else {
                    message.style.display = 'none';
                }
            }
        });
    });
}