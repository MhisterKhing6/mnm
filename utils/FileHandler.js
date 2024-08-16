/*Handles file operation for admin*/
import config from "config"
import { mkdir, readFile, writeFile } from "fs"
import path from "path"
import { promisify } from "util"
const readFileAsync = promisify(readFile)
const writeFileAsyc = promisify(writeFile)
const mkdirAsync = promisify(mkdir)

const createFilePath = async (foodName) => {
    /**
     * createDirectory: create a directory for a file
     * @param {string}:use to uniquly manage files folder structure
     * @returns {int}: positive or negatvie depending on successfull folder creation
     */
    //get absolute path of current directory calling the function
    let abs = path.resolve(".")
    //join paths to get parent directory of files
    let relativePath = path.join("public", "foodPics")
    let fullPath = path.join(abs, relativePath)
    //create folder on a disk
    try {
        let response = await mkdirAsync(fullPath, {recursive:true})
        //join created folder with fileName to create folder parent path
        let filePath = path.join(fullPath, foodName)
        let ulrPath = path.join(relativePath, foodName)
        return {filePath, ulrPath}
    } catch(err) {
        console.log(err)
        return null
    }
}

const decodeBase64 = async (bas64String)  => {
    /**
     * decodeBase64: decode base64 string to a buffer
     * base64String: a base 64 string to decode into a buffer
     */
    let buffer = Buffer.from(bas64String, "base64")
    return buffer
}

const getFileNameFromTitle = (title, fileName) => {
    let extension = fileName.split(".").pop()
    //get extension from user filename given
    let extName = path.extname(fileName)
    if(!extName)
        return null
    //replace space in title with dash
    let dashedtitle = title.replace(/\s+/g , "-");
    return dashedtitle + extName
}

const generateFileUrl = (filePath) => {
    let appHost = config.get("host")
    let host = process.env.HOST || appHost.ip
    let port = process.env.PORT || appHost.port
    let terface = appHost.onePath ||  `${appHost.protocol}://${host}:${port}`
    return `${terface}/${filePath}`
}

const saveUpolaodFileDisk = async (fileName, base64Data) => {
    /**
     * writeFile : saves buffer data to file
     * @param {string} fileName: file name of the file
     * @param {string} adminId: the id of the admiin uplaading the file, use for folder structure
     * @param {string} base64Data: base64 data to save
     * @returns {{status: 'int" , filePath:"str"}} status 0 if file exist, 1 if success with file path and -1 if error occured
     */
    //create file path
    try {
    let picPath  = await createFilePath(fileName)
    if(!picPath)
        return null
    //check if file with the same file name exist
    let buffer = await decodeBase64(base64Data)
    //write file to disk
    await writeFileAsyc(picPath.filePath, buffer)
    return picPath
        
    }catch(err) {
        console.log(err)
        return null
    }
}

export { createFilePath, generateFileUrl, getFileNameFromTitle, saveUpolaodFileDisk }
