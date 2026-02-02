
export const mediaManager = {
    upload: jest.fn().mockResolvedValue({
        fileUrl: 'http://mock.url/image.jpg',
        fileName: 'image.jpg'
    }),
    getDownloadUrl: jest.fn(),
    getFileUrl: jest.fn(),
    importFile: jest.fn()
};
