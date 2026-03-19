const fileObjectUrl = (fileImage) => {
  try {

    return URL.createObjectURL(fileImage);
  }
  catch (err) {
    console.log(err, 'fileObjectUrl___err');
    return fileImage;
  }
};

export default fileObjectUrl;