'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Session } from '@supabase/supabase-js'

// 1. Define the Shape of our Data
interface Bookmark {
  id: number
  created_at: string
  title: string
  url: string
  user_id: string
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')

  // 2. Define fetch function (wrapped in useCallback for stability)
  const fetchBookmarks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching:', error)
      } else {
        setBookmarks(data as Bookmark[])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    }
  }, [])

  // 3. Initial Setup & Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchBookmarks()
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchBookmarks()
      else setBookmarks([])
    })

    return () => subscription.unsubscribe()
  }, [fetchBookmarks])

  // 4. Realtime Listener (Requirements #4 & #5)
  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('realtime bookmarks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, (payload) => {
        console.log('Realtime update:', payload)
        fetchBookmarks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, fetchBookmarks])

  // 5. Handlers
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`, // Good practice to use callback
      },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setBookmarks([])
    setSession(null)
  }

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newUrl || !session) return

    const { error } = await supabase
      .from('bookmarks')
      .insert([{ 
        title: newTitle, 
        url: newUrl, 
        user_id: session.user.id 
      }])

    if (error) console.error('Error adding:', error)
    else {
      setNewTitle('')
      setNewUrl('')
      // Realtime listener will auto-update the list, but we can also fetch manually
      fetchBookmarks()
    }
  }

  const deleteBookmark = async (id: number) => {
    const { error } = await supabase.from('bookmarks').delete().match({ id })
    if (error) console.error('Error deleting:', error)
  }

  if (loading) return <div className="flex justify-center p-10 text-black">Loading...</div>

  // 6. Login Screen
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-black">
        <h1 className="text-3xl font-bold mb-6">Smart Bookmark App</h1>
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  // 7. Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50 text-black p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Bookmarks</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.user.email}</span>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
              Sign Out
            </button>
          </div>
        </div>

        {/* Add Bookmark Form */}
        <form onSubmit={addBookmark} className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Title (e.g. My Portfolio)"
            className="border border-gray-300 p-3 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            type="url"
            placeholder="URL (https://...)"
            className="border border-gray-300 p-3 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold transition">
            Add
          </button>
        </form>

        {/* Bookmark List */}
        <ul className="space-y-4">
          {bookmarks.map((bm) => (
            <li key={bm.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center transition hover:shadow-md">
              <div className="flex flex-col">
                <a 
                  href={bm.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-lg font-medium text-blue-600 hover:underline"
                >
                  {bm.title}
                </a>
                <span className="text-xs text-gray-400 mt-1">{new Date(bm.created_at).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => deleteBookmark(bm.id)}
                className="text-gray-400 hover:text-red-600 px-3 py-2 transition"
                title="Delete Bookmark"
              >
                ✕
              </button>
            </li>
          ))}
          {bookmarks.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>No bookmarks yet. Add one above!</p>
            </div>
          )}
        </ul>
      </div>
    </div>
  )
}