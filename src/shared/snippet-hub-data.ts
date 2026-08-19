import type { SnippetPack } from './types'

export const BUILTIN_SNIPPET_PACKS: SnippetPack[] = [
  {
    id: 'pack-docker',
    name: 'Docker & Container Master Pack',
    nameEn: 'Docker & Container Master Pack',
    description: 'Bộ lệnh thiết yếu quản lý Docker containers, dọn dẹp dung lượng và Docker Compose stack.',
    descriptionEn: 'Essential commands for managing Docker containers, cleaning up disk space, and running Docker Compose stacks.',
    category: 'docker',
    icon: 'Container',
    tags: ['docker', 'container', 'devops', 'compose'],
    author: 'CLIM Community',
    toolRequirements: 'Docker Desktop 20+ & Docker Compose v2',
    toolRequirementsEn: 'Docker Desktop 20+ & Docker Compose v2',
    commands: [
      {
        name: 'Dọn Dẹp Rác Docker (Prune All)',
        command: 'docker system prune -a --volumes -f',
        category: 'Docker',
        shell: 'powershell',
        tags: ['docker', 'cleanup', 'prune']
      },
      {
        name: 'Liệt Kê Containers Đang Chạy (Table View)',
        command: 'docker ps -a --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
        category: 'Docker',
        shell: 'powershell',
        tags: ['docker', 'ps', 'monitor']
      },
      {
        name: 'Dừng & Xóa Toàn Bộ Containers',
        command: 'docker stop $(docker ps -aq) 2>$null; docker rm $(docker ps -aq) 2>$null',
        category: 'Docker',
        shell: 'powershell',
        tags: ['docker', 'stop', 'remove']
      },
      {
        name: 'Khởi Động Docker Compose Ngầm (Detached)',
        command: 'docker compose up -d --remove-orphans',
        category: 'Docker',
        shell: 'powershell',
        tags: ['docker', 'compose', 'stack']
      },
      {
        name: 'Xem Log Realtime Của Service',
        command: 'docker compose logs -f --tail=100',
        category: 'Docker',
        shell: 'powershell',
        tags: ['docker', 'logs', 'stream']
      }
    ],
    sequences: [
      {
        name: 'Docker Clean & Rebuild Stack',
        description: 'Dừng containers cũ, dọn dẹp cache và khởi động lại Docker Compose với build mới.',
        category: 'Docker',
        shell: 'powershell',
        tags: ['docker', 'rebuild', 'pipeline'],
        runMode: 'first',
        steps: [
          { id: 's1', name: 'Dừng Stack Cũ', command: 'docker compose down --remove-orphans' },
          { id: 's2', name: 'Build Image Mới', command: 'docker compose build --no-cache' },
          { id: 's3', name: 'Khởi Chạy Detached', command: 'docker compose up -d' }
        ]
      }
    ]
  },
  {
    id: 'pack-nodejs',
    name: 'Node.js, React & Modern Web Hub',
    nameEn: 'Node.js, React & Modern Web Hub',
    description: 'Công cụ khởi tạo dự án Vite/Next.js, dọn dẹp node_modules, phân tích bundle và quản lý dependencies.',
    descriptionEn: 'Vite/Next.js scaffolds, node_modules cleanup, dependency upgrade checks, and bundle previews.',
    category: 'nodejs',
    icon: 'Code2',
    tags: ['node', 'react', 'vite', 'npm', 'frontend'],
    author: 'CLIM Community',
    toolRequirements: 'Node.js 18+ (LTS), npm 9+ hoặc pnpm / yarn',
    toolRequirementsEn: 'Node.js 18+ (LTS), npm 9+ or pnpm / yarn',
    commands: [
      {
        name: 'Khởi Tạo Project Vite React TypeScript',
        command: 'npm create vite@latest my-app -- --template react-ts',
        category: 'Frontend',
        shell: 'powershell',
        tags: ['vite', 'react', 'init']
      },
      {
        name: 'Dọn Sạch node_modules & Cài Đặt Lại',
        command: 'Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue; npm install',
        category: 'Frontend',
        shell: 'powershell',
        tags: ['npm', 'clean', 'reinstall']
      },
      {
        name: 'Kiểm Tra & Cập Nhật Gói Dependencies Lỗi Thời',
        command: 'npx npm-check-updates -u && npm install',
        category: 'Frontend',
        shell: 'powershell',
        tags: ['npm', 'upgrade', 'dependencies']
      },
      {
        name: 'Build Production & Chạy Preview Server',
        command: 'npm run build && npm run preview',
        category: 'Frontend',
        shell: 'powershell',
        tags: ['build', 'preview', 'prod']
      },
      {
        name: 'Chạy ESLint & Tự Động Sửa Lỗi Format',
        command: 'npx eslint . --fix && npx prettier --write .',
        category: 'Frontend',
        shell: 'powershell',
        tags: ['lint', 'format', 'code-quality']
      }
    ]
  },
  {
    id: 'pack-python',
    name: 'Python, AI & Data Science Toolbox',
    nameEn: 'Python, AI & Data Science Toolbox',
    description: 'Quản lý môi trường ảo (venv), kiểm tra GPU/CUDA PyTorch, quản lý requirements và train mô hình.',
    descriptionEn: 'Manage virtual environments (venv), verify PyTorch GPU/CUDA acceleration, pip freeze, and launch Jupyter.',
    category: 'python',
    icon: 'Sparkles',
    tags: ['python', 'ai', 'pytorch', 'cuda', 'venv'],
    author: 'CLIM Community',
    toolRequirements: 'Python 3.10+, pip & NVIDIA CUDA Driver (nếu dùng PyTorch GPU)',
    toolRequirementsEn: 'Python 3.10+, pip & NVIDIA CUDA Driver (for PyTorch GPU)',
    commands: [
      {
        name: 'Khởi Tạo Virtualenv & Kích Hoạt',
        command: 'python -m venv .venv; .venv\\Scripts\\Activate.ps1',
        category: 'Python',
        shell: 'powershell',
        tags: ['python', 'venv', 'init']
      },
      {
        name: 'Kiểm Tra Hỗ Trợ GPU CUDA (PyTorch)',
        command: 'python -c "import torch; print(f\'CUDA Available: {torch.cuda.is_available()}\'); print(f\'Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"CPU\"}\')"',
        category: 'Python',
        shell: 'powershell',
        tags: ['python', 'pytorch', 'cuda', 'gpu']
      },
      {
        name: 'Xuất Toàn Bộ Thư Viện Ra requirements.txt',
        command: 'pip freeze > requirements.txt',
        category: 'Python',
        shell: 'powershell',
        tags: ['python', 'pip', 'requirements']
      },
      {
        name: 'Cài Đặt Thư Viện Từ requirements.txt',
        command: 'pip install -r requirements.txt --upgrade',
        category: 'Python',
        shell: 'powershell',
        tags: ['python', 'pip', 'install']
      },
      {
        name: 'Khởi Động Jupyter Lab / Notebook',
        command: 'jupyter lab --no-browser --port={{PORT:-8888}}',
        category: 'Python',
        shell: 'powershell',
        tags: ['jupyter', 'datascience', 'notebook']
      }
    ]
  },
  {
    id: 'pack-windows',
    name: 'Windows DevOps, Network & System Kit',
    nameEn: 'Windows DevOps, Network & System Kit',
    description: 'Bộ lệnh tối ưu hóa mạng, xóa cache DNS, kiểm tra kết nối, giải phóng rác Temp và quản lý dịch vụ Windows.',
    descriptionEn: 'Network troubleshooting, DNS cache flush, IP adapters, Windows Temp cleanup, and service inspection.',
    category: 'windows',
    icon: 'Terminal',
    tags: ['windows', 'sysadmin', 'network', 'powershell'],
    author: 'CLIM Community',
    toolRequirements: 'Windows PowerShell 5.1 / PowerShell 7+ (Quyền Administrator)',
    toolRequirementsEn: 'Windows PowerShell 5.1 / PowerShell 7+ (Administrator Privileges)',
    commands: [
      {
        name: 'Xóa Cache DNS & Làm Mới IP Mạng',
        command: 'ipconfig /flushdns; ipconfig /release; ipconfig /renew',
        category: 'System',
        shell: 'powershell',
        tags: ['network', 'dns', 'ipconfig']
      },
      {
        name: 'Dọn Sạch Thư Mục Rác Tạm Thời Windows Temp',
        command: 'Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue',
        category: 'System',
        shell: 'powershell',
        tags: ['cleanup', 'temp', 'disk']
      },
      {
        name: 'Kiểm Tra Toàn Bộ Địa Chỉ IP & Adapter Mạng',
        command: 'Get-NetIPAddress -AddressFamily IPv4 | Format-Table InterfaceAlias, IPAddress, PrefixLength -AutoSize',
        category: 'System',
        shell: 'powershell',
        tags: ['network', 'ip', 'adapter']
      },
      {
        name: 'Kiểm Tra Trạng Thái Các Dịch Vụ Đang Chạy',
        command: 'Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object -First 20 Name, DisplayName',
        category: 'System',
        shell: 'powershell',
        tags: ['services', 'sysadmin']
      },
      {
        name: 'Kiểm Tra Tốc Độ Ping Độ Trễ DNS Google (8.8.8.8)',
        command: 'Test-Connection -TargetName 8.8.8.8 -Count 5',
        category: 'System',
        shell: 'powershell',
        tags: ['ping', 'network', 'latency']
      }
    ]
  },
  {
    id: 'pack-git',
    name: 'Git & GitHub Pro Workflows',
    nameEn: 'Git & GitHub Pro Workflows',
    description: 'Các câu lệnh Git chuyên sâu: hủy commit an toàn, dọn nhánh remote bị xóa, stash nâng cao và tạo branch chuẩn.',
    descriptionEn: 'Advanced Git workflows: safe undo commit, prune deleted remote branches, smart stash, and branch graphs.',
    category: 'git',
    icon: 'GitBranch',
    tags: ['git', 'github', 'version-control'],
    author: 'CLIM Community',
    toolRequirements: 'Git for Windows 2.30+ & GitHub CLI (gh - tùy chọn)',
    toolRequirementsEn: 'Git for Windows 2.30+ & GitHub CLI (gh - optional)',
    commands: [
      {
        name: 'Hủy Commit Gần Nhất (Giữ Lại Code Thay Đổi)',
        command: 'git reset --soft HEAD~1',
        category: 'Git',
        shell: 'powershell',
        tags: ['git', 'undo', 'reset']
      },
      {
        name: 'Lưu Tạm Toàn Bộ Code Vào Stash Kèm Ghi Chú',
        command: 'git stash push -m "WIP: {{TIMESTAMP}} - backup changes"',
        category: 'Git',
        shell: 'powershell',
        tags: ['git', 'stash']
      },
      {
        name: 'Dọn Dẹp Các Nhánh Đã Bị Xóa Trên Remote (Prune Branches)',
        command: 'git fetch -p; git branch -vv | Select-String ": gone\\]" | ForEach-Object { ($_.ToString().Trim() -split "\\s+")[0] } | ForEach-Object { git branch -D $_ }',
        category: 'Git',
        shell: 'powershell',
        tags: ['git', 'prune', 'clean-branches']
      },
      {
        name: 'Xem Lịch Sử Commit Dạng Cây Trực Quan (Graph Log)',
        command: 'git log --graph --oneline --decorate --all -n 20',
        category: 'Git',
        shell: 'powershell',
        tags: ['git', 'log', 'graph']
      },
      {
        name: 'Tạo Nhánh Mới & Chuyển Sang Ngay',
        command: 'git checkout -b feature/new-task-{{DATE}}',
        category: 'Git',
        shell: 'powershell',
        tags: ['git', 'branch', 'checkout']
      }
    ]
  },
  {
    id: 'pack-pipelines',
    name: 'Full-Stack & DevOps Automation Pipelines',
    nameEn: 'Full-Stack & DevOps Automation Pipelines',
    description: 'Các quy trình chuỗi lệnh tự động hóa hoàn chỉnh cho Full-stack app và cơ sở dữ liệu.',
    descriptionEn: 'Full automated sequences and pipelines for Full-Stack development, Postgres & Redis docker dev stacks.',
    category: 'pipelines',
    icon: 'ListOrdered',
    tags: ['pipeline', 'automation', 'fullstack', 'database'],
    author: 'CLIM Community',
    toolRequirements: 'Node.js 18+, Docker Desktop & PostgreSQL / Redis',
    toolRequirementsEn: 'Node.js 18+, Docker Desktop & PostgreSQL / Redis',
    commands: [],
    sequences: [
      {
        name: 'Full-Stack Dev Environment Setup',
        description: 'Tự động kiểm tra Node, cài đặt gói phụ thuộc và khởi động cả frontend lẫn backend.',
        category: 'Full-Stack',
        shell: 'powershell',
        tags: ['fullstack', 'setup', 'pipeline'],
        runMode: 'first',
        steps: [
          { id: 'st1', name: 'Kiểm tra phiên bản Node & NPM', command: 'node -v; npm -v' },
          { id: 'st2', name: 'Cài đặt Dependencies', command: 'npm install' },
          { id: 'st3', name: 'Khởi chạy Dev Server', command: 'npm run dev' }
        ]
      },
      {
        name: 'PostgreSQL & Redis Local Dev Stack',
        description: 'Khởi chạy database PostgreSQL và Redis cache qua Docker container cục bộ.',
        category: 'Database',
        shell: 'powershell',
        tags: ['docker', 'postgres', 'redis', 'db'],
        runMode: 'all',
        steps: [
          { id: 'db1', name: 'Start Postgres Container', command: 'docker run --name dev-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine' },
          { id: 'db2', name: 'Start Redis Container', command: 'docker run --name dev-redis -p 6379:6379 -d redis:7-alpine' }
        ]
      }
    ]
  }
]

