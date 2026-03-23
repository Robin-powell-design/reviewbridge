'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createReview(data: {
  id: string
  title: string
  context: string
  embed_url: string
  embed_type: 'prototype' | 'figma' | 'upload'
  loom_url: string
  questions: { text: string; type: string }[]
}) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('reviews').insert({
    id: data.id,
    title: data.title,
    context: data.context,
    embed_url: data.embed_url,
    embed_type: data.embed_type,
    loom_url: data.loom_url,
    questions: data.questions,
    status: 'active',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/')
  return { id: data.id }
}

export async function updateReviewStatus(id: string, status: 'active' | 'closed') {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('reviews')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function deleteReview(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('reviews').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function getReviews() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('reviews')
    .select('*, responses(*)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function updateReview(id: string, data: {
  title: string
  context: string
  embed_url: string
  embed_type: 'prototype' | 'figma' | 'upload'
  loom_url: string
  questions: { text: string; type: string }[]
}) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('reviews')
    .update({
      title: data.title,
      context: data.context,
      embed_url: data.embed_url,
      embed_type: data.embed_type,
      loom_url: data.loom_url,
      questions: data.questions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath(`/r/${id}`)
  revalidatePath(`/results/${id}`)
  return { id }
}

export async function getReviewById(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('reviews')
    .select('*, responses(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
