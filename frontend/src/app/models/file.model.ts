export interface PatientFile {
    id: string;
    patientId: string;
    originalName: string;
    storedPath: string;
    mimeType: string;
    size: number;
    category: 'radiografia' | 'ecografia' | 'analitica' | 'informe' | 'otro';
    description?: string;
    createdAt: string;
    checksum?: string | null;
}

export interface FileUploadData {
    file: File;
    category: string;
    description?: string;
}
