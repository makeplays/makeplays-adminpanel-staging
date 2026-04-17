const fileObjectUrl = (fileImage) => {
    try {
        console.log(fileImage, URL.createObjectURL(fileImage), 'fileObjectUrl')
        return URL.createObjectURL(fileImage)
    }
    catch (err) {
        console.log(err, 'fileObjectUrl___err')
        return fileImage
    }
}

export default fileObjectUrl;