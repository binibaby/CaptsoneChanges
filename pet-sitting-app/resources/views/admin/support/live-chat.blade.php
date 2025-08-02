@extends('admin.layouts.app')

@section('content')
<div class="space-y-6">
    <!-- Page Header -->
    <div class="sm:flex sm:items-center sm:justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Live Chat Support</h1>
            <p class="mt-2 text-sm text-gray-700">Manage real-time customer support conversations.</p>
        </div>
        <div class="mt-4 sm:mt-0">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                {{ $activeChats->count() }} Active Chats
            </span>
        </div>
    </div>

    <!-- Chat Sessions Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Chat Sessions List -->
        <div class="lg:col-span-1">
            <div class="bg-white shadow rounded-lg">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Active Sessions</h3>
                </div>
                <div class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    @forelse($activeChats as $chat)
                    <div class="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                         onclick="loadChatSession({{ $chat->id }})">
                        <div class="flex items-center space-x-3">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span class="text-sm font-medium text-indigo-700">{{ $chat->user->name[0] }}</span>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 truncate">{{ $chat->user->name }}</p>
                                <p class="text-sm text-gray-500 truncate">{{ $chat->subject }}</p>
                                <p class="text-xs text-gray-400">{{ $chat->updated_at->diffForHumans() }}</p>
                            </div>
                            <div class="flex-shrink-0">
                                @if($chat->messages->count() > 0)
                                <span class="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                                    {{ $chat->messages->where('is_read', false)->count() }}
                                </span>
                                @endif
                            </div>
                        </div>
                    </div>
                    @empty
                    <div class="p-4 text-center text-gray-500">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p class="mt-2 text-sm">No active chat sessions</p>
                    </div>
                    @endforelse
                </div>
            </div>
        </div>

        <!-- Chat Interface -->
        <div class="lg:col-span-2">
            <div class="bg-white shadow rounded-lg h-96 flex flex-col">
                <!-- Chat Header -->
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span class="text-sm font-medium text-indigo-700" id="chatUserInitial">-</span>
                            </div>
                            <div>
                                <h3 class="text-lg font-medium text-gray-900" id="chatUserName">Select a chat session</h3>
                                <p class="text-sm text-gray-500" id="chatUserEmail">-</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800" id="chatStatus">
                                -
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Messages Area -->
                <div class="flex-1 overflow-y-auto p-6" id="messagesContainer">
                    <div class="text-center text-gray-500 py-8">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p class="mt-2 text-sm">Select a chat session to start messaging</p>
                    </div>
                </div>

                <!-- Message Input -->
                <div class="px-6 py-4 border-t border-gray-200">
                    <form id="messageForm" class="flex space-x-3">
                        <input type="hidden" id="currentChatId" value="">
                        <div class="flex-1">
                            <input type="text" id="messageInput" 
                                   class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                   placeholder="Type your message..." disabled>
                        </div>
                        <button type="submit" id="sendButton"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
let currentChatId = null;
let lastMessageId = null;
let messagePollingInterval = null;
let chatListPollingInterval = null;

function loadChatSession(chatId) {
    currentChatId = chatId;
    
    // Update UI to show loading
    document.getElementById('messagesContainer').innerHTML = `
        <div class="text-center text-gray-500 py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-2 text-sm">Loading chat...</p>
        </div>
    `;
    
    // Fetch chat details and messages
    fetch(`/admin/support/live-chat/${chatId}/messages`)
        .then(response => response.json())
        .then(data => {
            updateChatInterface(data);
            lastMessageId = data.last_message_id;
            
            // Start real-time polling for new messages
            startMessagePolling();
        })
        .catch(error => {
            console.error('Error loading chat:', error);
        });
}

function updateChatInterface(data) {
    const chat = data.chat;
    const messages = data.messages;
    
    // Update chat header
    document.getElementById('chatUserInitial').textContent = chat.user.name[0];
    document.getElementById('chatUserName').textContent = chat.user.name;
    document.getElementById('chatUserEmail').textContent = chat.user.email;
    document.getElementById('chatStatus').textContent = chat.status;
    document.getElementById('currentChatId').value = chat.id;
    
    // Enable message input
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendButton').disabled = false;
    
    // Render messages
    renderMessages(messages);
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p class="text-sm">No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    const messagesHtml = messages.map(message => `
        <div class="flex ${message.user.role === 'admin' ? 'justify-end' : 'justify-start'} mb-4">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.user.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}">
                <div class="flex items-center space-x-2 mb-1">
                    <span class="text-xs font-medium">${message.user.name}</span>
                    <span class="text-xs opacity-75">${new Date(message.created_at).toLocaleTimeString()}</span>
                </div>
                <p class="text-sm">${message.message}</p>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = messagesHtml;
    container.scrollTop = container.scrollHeight;
}

// Handle message form submission
document.getElementById('messageForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentChatId) return;
    
    // Disable input while sending
    const sendButton = document.getElementById('sendButton');
    const originalText = sendButton.innerHTML;
    sendButton.disabled = true;
    sendButton.innerHTML = `
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
    `;
    
    // Send message
    fetch(`/admin/support/live-chat/${currentChatId}/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageInput.value = '';
            
            // Add message to chat immediately
            const newMessage = {
                id: data.message.id,
                message: data.message.message,
                created_at: data.message.created_at,
                user: data.message.user
            };
            
            appendNewMessages([newMessage]);
            lastMessageId = data.message.id;
            
            // Show success indicator
            showMessageSentIndicator();
        } else {
            showErrorMessage('Failed to send message. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        showErrorMessage('Network error. Please check your connection.');
    })
    .finally(() => {
        // Re-enable input
        sendButton.disabled = false;
        sendButton.innerHTML = originalText;
    });
});

function showMessageSentIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg';
    indicator.textContent = 'Message sent ✓';
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.remove();
    }, 2000);
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Real-time message polling
function startMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    
    messagePollingInterval = setInterval(() => {
        if (currentChatId && lastMessageId) {
            fetch(`/admin/support/live-chat/${currentChatId}/new-messages?last_message_id=${lastMessageId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.has_new_messages) {
                        appendNewMessages(data.new_messages);
                        lastMessageId = data.last_message_id;
                    }
                })
                .catch(error => {
                    console.error('Error polling messages:', error);
                });
        }
    }, 3000); // Poll every 3 seconds
}

function appendNewMessages(newMessages) {
    const container = document.getElementById('messagesContainer');
    
    newMessages.forEach(message => {
        const messageHtml = `
            <div class="flex ${message.user.role === 'admin' ? 'justify-end' : 'justify-start'} mb-4">
                <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.user.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}">
                    <div class="flex items-center space-x-2 mb-1">
                        <span class="text-xs font-medium">${message.user.name}</span>
                        <span class="text-xs opacity-75">${new Date(message.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p class="text-sm">${message.message}</p>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', messageHtml);
    });
    
    container.scrollTop = container.scrollHeight;
}

// Real-time chat list updates
function startChatListPolling() {
    chatListPollingInterval = setInterval(() => {
        fetch('/admin/support/live-chat/active-chats')
            .then(response => response.json())
            .then(data => {
                updateChatList(data.active_chats);
                updateActiveChatsBadge(data.total_active, data.total_unread);
            })
            .catch(error => {
                console.error('Error polling chat list:', error);
            });
    }, 10000); // Poll every 10 seconds
}

function updateChatList(activeChats) {
    const chatListContainer = document.querySelector('.divide-y.divide-gray-200');
    if (!chatListContainer) return;
    
    const chatListHtml = activeChats.map(chat => `
        <div class="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${currentChatId === chat.id ? 'bg-indigo-50' : ''}"
             onclick="loadChatSession(${chat.id})">
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span class="text-sm font-medium text-indigo-700">${chat.user.name[0]}</span>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${chat.user.name}</p>
                    <p class="text-sm text-gray-500 truncate">${chat.subject}</p>
                    <p class="text-xs text-gray-400">${new Date(chat.updated_at).toLocaleTimeString()}</p>
                </div>
                <div class="flex-shrink-0">
                    ${chat.unread_count > 0 ? `
                        <span class="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                            ${chat.unread_count}
                        </span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    chatListContainer.innerHTML = chatListHtml;
}

function updateActiveChatsBadge(totalActive, totalUnread) {
    const badge = document.querySelector('.bg-green-100.text-green-800');
    if (badge) {
        badge.innerHTML = `
            <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            ${totalActive} Active Chats
            ${totalUnread > 0 ? `(${totalUnread} unread)` : ''}
        `;
    }
}

// Initialize real-time features
document.addEventListener('DOMContentLoaded', function() {
    startChatListPolling();
    
    // Clean up intervals on page unload
    window.addEventListener('beforeunload', function() {
        if (messagePollingInterval) clearInterval(messagePollingInterval);
        if (chatListPollingInterval) clearInterval(chatListPollingInterval);
    });
});
</script>
@endsection 
 