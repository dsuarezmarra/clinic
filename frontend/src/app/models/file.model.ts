export interface PatientFile {
    id: number;
    patientId: number;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    category: 'radiografia' | 'ecografia' | 'analitica' | 'informe' | 'otro';
    description?: string;
    uploadDate: string;
    filePath: string;
}

export interface FileUploadData {
    file: File;
    category: string;
    description?: string;
}
