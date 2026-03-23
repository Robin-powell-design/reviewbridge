'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitResponse(data: {
  id: string
  review_id: string
  reviewer_name: string
  vibe_score: number
  quick_take: string
  answers: { question: string; answer: string }[]
  pins: { pin: string; comment: string; x?: number; y?: number }[]
}) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('responses').insert({
    id: data.id,
    review_id: data.review_id,
    reviewer_name: data.reviewer_name,
    vibe_score: data.vibe_score,
    quick_take: data.quick_take,
    answers: data.answers,
    pins: data.pins,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/results/${data.review_id}`)
  revalidatePath(`/r/${data.review_id}`)
  return { success: true }
}
