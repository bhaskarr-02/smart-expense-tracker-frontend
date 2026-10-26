// Shared contacts list - family members + friends used across the app

export function getContacts() {
  const family  = JSON.parse(localStorage.getItem('familyMembers') || '[]')
  const friends = JSON.parse(localStorage.getItem('friends') || '[]')
  return { family, friends, all: [...family, ...friends] }
}

export function addFriend(name) {
  const friends = JSON.parse(localStorage.getItem('friends') || '[]')
  if (friends.find(f => f.name === name)) return friends
  const updated = [...friends, { id: Date.now(), name, role: 'Friend' }]
  localStorage.setItem('friends', JSON.stringify(updated))
  return updated
}

export function removeFriend(id) {
  const friends = JSON.parse(localStorage.getItem('friends') || '[]')
  const updated = friends.filter(f => f.id !== id)
  localStorage.setItem('friends', JSON.stringify(updated))
  return updated
}
