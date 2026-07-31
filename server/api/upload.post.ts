import { readMultipartFormData } from 'h3'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

  const file = parts.find(p => p.name === 'file')
  if (!file?.data || !file.filename) throw createError({ statusCode: 400, statusMessage: 'File field required' })

  const ext = file.filename.split('.').pop()?.toLowerCase() || 'bin'
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowed.includes(ext)) throw createError({ statusCode: 400, statusMessage: 'Only images allowed' })

  const filename = `${Date.now()}-${file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  mkdirSync(uploadDir, { recursive: true })
  writeFileSync(join(uploadDir, filename), file.data)

  return { url: `/uploads/${filename}` }
})
