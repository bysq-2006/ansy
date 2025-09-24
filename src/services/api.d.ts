declare module '@/services/api' {
  interface DocumentItemMeta {
    id: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    coverUrl?: string | null;
    createdAt: string;
    updatedAt: string;
    size: number;
    filename?: string;
    content?: string;
  }

  interface ApiListResponse<T> { success: boolean; data: T; }
  interface ApiItemResponse<T> { success: boolean; data: T; }

  export const documentService: {
    getDocuments(): Promise<ApiListResponse<DocumentItemMeta[]>>;
    getDocument(id: string): Promise<ApiItemResponse<DocumentItemMeta>>;
    createDocument(data: { title: string; content: string; description?: string; imageUrl?: string; coverUrl?: string }): Promise<any>;
    updateDocument(id: string, data: Partial<{ title: string; content: string; description: string; imageUrl: string; coverUrl: string }>): Promise<any>;
    deleteDocument(id: string): Promise<any>;
    checkHealth(): Promise<any>;
  };
  const _default: any;
  export default _default;
}