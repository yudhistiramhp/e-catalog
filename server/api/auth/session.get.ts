import { getSessionUser } from '../../utils/session'

export default defineEventHandler((event) => getSessionUser(event))
