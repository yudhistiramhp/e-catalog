import { readMultipartFormData } from 'h3'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({ url: process.env.CLOUDINARY_URL })

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

  const file = parts.find(p => p.name === 'file')
  if (!file?.data || !file.filename) throw createError({ statusCode: 400, statusMessage: 'File field required' })

  const ext = file.filename.split('.').pop()?.toLowerCase() || ''
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowed.includes(ext)) throw createError({ statusCode: 400, statusMessage: 'Only images allowed' })

  const buffer = file.data.toString('base64')
  const result = await cloudinary.uploader.upload(`data:image/${ext};base64,${buffer}`, {
    folder: 'e-catalog'
  })

  return { url: result.secure_url }
})
