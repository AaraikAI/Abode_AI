'use client'

import { useState, useEffect } from 'react'
import { FileText, Image, Download, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ProjectFile {
  id: string
  project_id: string
  original_name: string
  file_name: string
  file_type: string
  file_size: number
  url: string
  pages?: number
  uploaded_by: string
  uploaded_at: string
}

interface FileListProps {
  projectId: string
  onFileClick?: (file: ProjectFile) => void
  refreshTrigger?: number
}

export function FileList({ projectId, onFileClick, refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/files/upload`)
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }

      const data = await response.json()
      setFiles(data.files || [])
    } catch (err) {
      console.error('Error fetching files:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [projectId, refreshTrigger])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />
    }
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const getFileTypeBadge = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <Badge variant="destructive">PDF</Badge>
    }
    if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
      return <Badge variant="default">JPG</Badge>
    }
    if (fileType === 'image/png') {
      return <Badge variant="secondary">PNG</Badge>
    }
    return <Badge variant="outline">Unknown</Badge>
  }

  const handleDelete = async () => {
    if (!deleteFileId) return

    try {
      const response = await fetch(`/api/projects/${projectId}/files/${deleteFileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      // Refresh list
      await fetchFiles()
      setDeleteFileId(null)
    } catch (err) {
      console.error('Error deleting file:', err)
      alert('Failed to delete file')
    }
  }

  const handleDownload = (file: ProjectFile) => {
    window.open(file.url, '_blank')
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading files...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchFiles} className="mt-4">
          Retry
        </Button>
      </Card>
    )
  }

  if (files.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No files uploaded yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Upload site plans, images, or PDFs to get started
        </p>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  {getFileIcon(file.file_type)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[300px]">
                      {file.original_name}
                    </span>
                    {getFileTypeBadge(file.file_type)}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatFileSize(file.file_size)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {file.pages || '-'}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(file.uploaded_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileClick?.(file)}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteFileId(file.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFileId} onOpenChange={(open) => !open && setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
