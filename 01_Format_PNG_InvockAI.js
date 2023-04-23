const path = require("path");
const fs = require("fs-extra");
const png = require('png-metadata')

// CONSTANTES systèmes
const folderBase = "SiteWeb/images";


//joining path of directory
const directoryPath = path.join(folderBase);

regexMaster = /\d+\_master\.[a-z]+/
fs.readdir(directoryPath, function (err, files) {
  //handling error
  if (err) {
    return console.log("Unable to scan directory: " + err);
  }

  console.log("Etape 0 : Listage des fichiers .png dans '"+directoryPath+"'")

  files.forEach(function (file) {
    // Si c'est un fichier JSON
    if (file.endsWith(".png") & !regexMaster.exec(file) & !fs.existsSync(path.join(folderBase,file.substring(0,file.length-3)+"json"))) {
      // J'ajoute dans "JsonFiles" le fichier JSON
      //JsonFiles.push(file);
      console.log(file);
      const s = png.readFileSync(path.join(folderBase,file));
      const list = png.splitChunk(s);
      try {
        list.forEach(element => {
          if("tEXt"==element.type & element.data.startsWith("sd-metadata")){
              const text = element.data.substring("sd-metadata".length+1)
              let json = JSON.parse(text)
              for (const key in json.image) {
                if (Object.hasOwnProperty.call(json.image, key)) {
                  const attribut = json.image[key];
                  json[key]=attribut
                }
              }
              delete  json.image

              fs.writeJSONSync(path.join(folderBase,file.substring(0,file.length-3)+"json"),json,{spaces : 4})
              //const json = fs.readJSONSync(path.join(folderBase,file.substring(0,file.length-3)+"json"))
          } 
      });
      } catch (error) {
        console.log(error)
      }
    }
  });
})
