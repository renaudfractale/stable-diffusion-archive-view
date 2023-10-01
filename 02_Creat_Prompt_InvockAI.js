const path = require("path");
const fs = require("fs-extra");

// CONSTANTES systèmes
const folderBase = "SiteWeb/images";

//joining path of directory
const directoryPath = path.join(folderBase);

fs.readdir(directoryPath, function (err, files) {
  //handling error
  if (err) {
    return console.log("Unable to scan directory: " + err);
  }

  console.log("Etape 2 : création des Prompt dans '" + directoryPath + "'");

  files.forEach(function (file) {
    // Si c'est un fichier JSON
    if (file.endsWith(".json")) {
      console.log(file);
      const fileJSON = fs.readJsonSync(path.join(folderBase, file));
      if(fileJSON["prompt"]==undefined){
        
        let positive_prompt =""
        if(fileJSON["positive_prompt"]!=undefined){
          positive_prompt = fileJSON["positive_prompt"]
        }


        let negative_prompt =""
        if(fileJSON["negative_prompt"]!=undefined){
          negative_prompt = fileJSON["negative_prompt"]
        }

        let prompt = positive_prompt+" ["+negative_prompt+"]"
        console.log(prompt)
        fileJSON.prompt = prompt

        fs.writeJsonSync(path.join(folderBase, file),fileJSON,{ spaces:2 });
      }
    }
  });
});
