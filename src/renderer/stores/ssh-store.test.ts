import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSSHStore, buildSSHCommand } from './ssh-store'
import type { SSHHost } from '@shared/types'

describe('SSH Store and Command Builder', () => {
  beforeEach(() => {
    useSSHStore.setState({
      hosts: [],
      loading: false,
      searchQuery: '',
      selectedGroup: 'all',
      selectedHostId: null,
      statusMap: {}
    })
  })

  it('should build basic SSH command with port and user@host', () => {
    const host: SSHHost = {
      id: 'h1',
      name: 'My VPS',
      host: '192.168.1.100',
      port: 2222,
      username: 'ubuntu',
      authType: 'password',
      tags: [],
      createdAt: 1000,
      updatedAt: 1000
    }

    const cmd = buildSSHCommand(host)
    expect(cmd).toBe('ssh -p 2222 ubuntu@192.168.1.100')
  })

  it('should build SSH command with private key path', () => {
    const host: SSHHost = {
      id: 'h2',
      name: 'AWS EC2',
      host: 'ec2-54-123.compute.aws.com',
      port: 22,
      username: 'ec2-user',
      authType: 'privateKey',
      privateKeyPath: 'C:/keys/my server.pem',
      tags: [],
      createdAt: 1000,
      updatedAt: 1000
    }

    const cmd = buildSSHCommand(host)
    expect(cmd).toBe('ssh -i "C:/keys/my server.pem" ec2-user@ec2-54-123.compute.aws.com')
  })

  it('should build SSH command with port forwarding tunnels', () => {
    const host: SSHHost = {
      id: 'h3',
      name: 'Database Jump',
      host: 'db.prod.internal',
      port: 22,
      username: 'admin',
      authType: 'password',
      tags: [],
      tunnels: [
        { id: 't1', name: 'MySQL', localPort: 3307, remoteHost: '127.0.0.1', remotePort: 3306, type: 'local' },
        { id: 't2', name: 'Redis', localPort: 6380, remoteHost: 'localhost', remotePort: 6379, type: 'local' }
      ],
      createdAt: 1000,
      updatedAt: 1000
    }

    const cmd = buildSSHCommand(host)
    expect(cmd).toBe('ssh -L 3307:127.0.0.1:3306 -L 6380:localhost:6379 admin@db.prod.internal')
  })

  it('should save and delete host from state', async () => {
    const host: SSHHost = {
      id: 'test-1',
      name: 'Test Server',
      host: '1.2.3.4',
      port: 22,
      username: 'root',
      authType: 'password',
      tags: ['prod'],
      createdAt: 1000,
      updatedAt: 1000
    }

    await useSSHStore.getState().saveHost(host)
    expect(useSSHStore.getState().hosts.length).toBe(1)
    expect(useSSHStore.getState().hosts[0].name).toBe('Test Server')

    await useSSHStore.getState().deleteHost('test-1')
    expect(useSSHStore.getState().hosts.length).toBe(0)
  })
})
