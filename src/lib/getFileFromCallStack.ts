export function getFileFromCallStack(depth  = 1) {
  return new Error().stack.split('\n')[depth + 2].match(/\((.*):(\d):(\d)\)/)?.[1]
}