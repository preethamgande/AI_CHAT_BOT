const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getChats() {
  return fetch(`${BASE_URL}/chats`, {
    credentials: "include",
  });
}

export async function createChat() {
  return fetch(`${BASE_URL}/chats`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getChatById(id) {
  return fetch(`${BASE_URL}/chats/${id}`, {
    credentials: "include",
  });
}

export async function deleteChat(id) {
  return fetch(`${BASE_URL}/chats/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}
