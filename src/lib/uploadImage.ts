import { createClient } from '@/lib/supabase/client'

export async function uploadImage(file: File, reviewId: string): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'png'
  const path = `${reviewId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('review-images')
    .upload(path, file, { contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage
    .from('review-images')
    .getPublicUrl(path)

  return data.publicUrl
}
