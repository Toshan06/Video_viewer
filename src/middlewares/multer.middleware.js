import multer from "multer";

const multerStorage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./public/temp")
    },
    filename: function(req,file,cb){
        cb(null,file.originalname)
    }
})

export const upload = multer({storage: multerStorage })
