export interface PortDefinition {
  service: string
  description: string
  importance: 'System' | 'Common' | 'Development' | 'Unknown'
}

export const PORT_DICT: Record<number, PortDefinition> = {
  20: { service: 'FTP', description: 'File Transfer Protocol (Data)', importance: 'Common' },
  21: { service: 'FTP', description: 'File Transfer Protocol (Control)', importance: 'Common' },
  22: { service: 'SSH', description: 'Secure Shell', importance: 'Common' },
  23: { service: 'Telnet', description: 'Telnet protocol - unencrypted text communications', importance: 'Common' },
  25: { service: 'SMTP', description: 'Simple Mail Transfer Protocol', importance: 'Common' },
  53: { service: 'DNS', description: 'Domain Name System', importance: 'System' },
  80: { service: 'HTTP', description: 'Hypertext Transfer Protocol', importance: 'Common' },
  110: { service: 'POP3', description: 'Post Office Protocol', importance: 'Common' },
  135: { service: 'MSRPC', description: 'Microsoft RPC - Dùng cho các dịch vụ Windows', importance: 'System' },
  137: { service: 'NetBIOS', description: 'NetBIOS Name Service', importance: 'System' },
  138: { service: 'NetBIOS', description: 'NetBIOS Datagram Service', importance: 'System' },
  139: { service: 'NetBIOS', description: 'NetBIOS Session Service', importance: 'System' },
  143: { service: 'IMAP', description: 'Internet Message Access Protocol', importance: 'Common' },
  443: { service: 'HTTPS', description: 'HTTP Secure (SSL/TLS)', importance: 'Common' },
  445: { service: 'SMB', description: 'Microsoft-DS Active Directory / Windows File Sharing', importance: 'System' },
  3306: { service: 'MySQL', description: 'MySQL Database System', importance: 'Development' },
  3389: { service: 'RDP', description: 'Remote Desktop Protocol', importance: 'System' },
  5000: { service: 'Flask/Dev', description: 'Thường dùng cho web development (Flask, React...)', importance: 'Development' },
  5173: { service: 'Vite', description: 'Vite Dev Server mặc định', importance: 'Development' },
  5432: { service: 'PostgreSQL', description: 'PostgreSQL Database System', importance: 'Development' },
  8000: { service: 'Dev Server', description: 'Thường dùng cho web development', importance: 'Development' },
  8080: { service: 'HTTP Alt', description: 'HTTP Alternate (thường dùng cho dev hoặc proxy)', importance: 'Development' },
  3000: { service: 'Dev Server', description: 'Mặc định của Node.js, React, Next.js, v.v.', importance: 'Development' },
  6379: { service: 'Redis', description: 'Redis Database', importance: 'Development' },
  27017: { service: 'MongoDB', description: 'MongoDB Database System', importance: 'Development' },
}

export function getPortInfo(port: number): PortDefinition {
  return PORT_DICT[port] || { service: 'Unknown', description: 'Không có dữ liệu chi tiết', importance: 'Unknown' }
}
