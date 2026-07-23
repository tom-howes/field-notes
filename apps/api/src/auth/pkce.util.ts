import { createHash, randomBytes } from 'crypto'

function base64url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function generateState(): string {
  return base64url(randomBytes(16))
}

export function generateCodeVerifier(): string {
  return base64url(randomBytes(64))
}

export function deriveCodeChallenge(codeVerifier: string): string {
  return base64url(createHash('sha256').update(codeVerifier).digest())
}
