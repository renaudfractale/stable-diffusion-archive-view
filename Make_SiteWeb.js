const im = require("imagemagick");
const path = require("path");
const fs = require("fs-extra");

// Fonction pour décoder les donnée de base 64 en fichier image
function decode_base64(base64str, filename) {
  var buf = Buffer.from(base64str, "base64");
  fs.writeFileSync(filename, buf)
}
// CONSTANTES systèmes
const folderBase = "SiteWeb/images";
const mainJson = "main.json";
const widthMinImg = 256;

// CONSTANTES Template
const IndexFile = "index.html";
const SubPageFile = "SubPage.html";
const ItemsFile = "Items.html";

//Ouverture et Init de "MainData", la base de donnée de l'application
let MainData = { lastNb: 0 };
if (fs.existsSync(mainJson)) {
  MainData = fs.readJSONSync(mainJson);
}

//joining path of directory
const directoryPath = path.join(folderBase);
//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
  //handling error
  if (err) {
    return console.log("Unable to scan directory: " + err);
  }
 
  let JsonFiles = [];
  let ImgFiles = [];
  console.log("Etape 1 : Listage des fichiers .JSON dans '"+directoryPath+"'")
   //listing all files using forEach
  files.forEach(function (file) {
    // Si c'est un fichier JSON
    if (file.endsWith(".json")) {
      // J'ajoute dans "JsonFiles" le fichier JSON
      JsonFiles.push(file);
    } else {
      // J'ajoute dans "ImgFiles" les autes fichiers, Notemant les fichiers image non traités
      ImgFiles.push(file);
    }
  });
  
  // Regex pour filtrer les fichiers Json déjà traité
  const RegexOfJsonFile = new RegExp(/^\d+$/);
  // Regex pour extraire les élémenets des images en bas64 dans le fichier JSON
  const RegexDataImage = /^data\:image\/(?<extension>[A-z]+)\;base64,(?<data>.+)$/
  
  console.log("Etape 2 : Analyse des fichiers .JSON dans '"+directoryPath+"'")
  //Je parcourt les fichiers JSON 
  JsonFiles.forEach(function (JsonFile) {
    // Je recupère le noms dans extentions du fichier JSON
    const file = JsonFile.substring(0, JsonFile.length - 5);
    
    // Si le noms du fichier est unn suite de chiffres => C'est qu'il a déja été traité 
    // donc si le Regex est Vrai, on ignore le fichier
    if (!file.match(RegexOfJsonFile)) {
      console.log("Etape 2.1 : Ajout dans la base de donnée du fichier '"+JsonFile+"'")
      // On initialise la variable "fileImg" qui va condenir le noms du fichier Image généré par Easy diffusion
      let fileImg = "";
      // On parcours la liste des fichier non JSON
      ImgFiles.forEach(function (ImgFile) {
        // Si le fichier a le même nom qui le fichier JSON, on le recupère
        if (ImgFile.startsWith(file)) {
          fileImg = ImgFile;
          return
        }
      });
      // Si la variable "fileImg" n'est pas vide, que l'on a trouvé le fichier Image corespondant au fichier JSON "JsonFile"
      if (fileImg.length > 0) {
        //On Utlise l'attribut "lastNb" de "MainData" pour générer un nouveau ID
        const NbRaw = "0000000" + MainData.lastNb.toString();
        
        //On incrémente "lastNb" de "MainData" pour que l'ID soit Unique
        MainData.lastNb++;
        
        // On crée "Nb", un string de 5 chiffre
        const Nb = NbRaw.substring(NbRaw.length - 5);

        // On récupère l'extention du fichier image
        const fileExtensionImg = fileImg.replace(file, "");

        console.log("Etape 2.2 : Assignation de l'ID '"+Nb+"' aux fichiers '"+file+"'")

        // On dévini les variables pour renommer les fichiers JSON et Images
        const BaseFileNo = Nb;
        const newFileImg = BaseFileNo + fileExtensionImg;
        const newFileJson = BaseFileNo + ".json";
        const newFileMin = BaseFileNo + "_min" + ".jpg";
        const newFileMaster = BaseFileNo + "_master" + ".";
        
        console.log("Etape 2.3 : Début du renommage des fichiers")
        // Renomage du fichier JSON
        fs.moveSync(
          path.join(folderBase, JsonFile),
          path.join(folderBase, newFileJson)
        );
        
        // Renomage du fichier Image
        fs.moveSync(
          path.join(folderBase, fileImg),
          path.join(folderBase, newFileImg)
        );

        //Création d'une miniature
        im.resize({
          srcPath: path.join(folderBase, newFileImg),
          dstPath: path.join(folderBase, newFileMin),
          width: widthMinImg,
        });
        console.log("Etape 2.3 : Fin du renommage des fichiers")

        console.log("Etape 2.4 : Début de la mise à jour de la base de données JSON")
        //Je récupère les données du fichier JSON nouvellement renommé
        let JsonValues = fs.readJSONSync(path.join(folderBase, newFileJson));
        // Je l'ajoute  à la base de données de l'application "MainData"
        MainData[BaseFileNo] = {
          full: newFileImg,
          min: newFileMin,
          json: newFileJson,
        };

        // si il y a une images de référence qui a été utilisé pour générer l'image de sortie
        if (JsonValues.init_image) {

          // Je récupére le String en Base64
          const RawDataImage = JsonValues.init_image
          // J'extrait les infot utile (extention de fichier + Image Data en Base64)
          const DataImage = RegexDataImage.exec(RawDataImage)

          // Nom du Fichier master, qui a été utilisé pour générer l'image de sortie
          const Master = path.join(folderBase, newFileMaster+DataImage.groups.extension);
          
          //Je crée le fichier master qui a été utilisé pour générer l'image de sortie
          decode_base64(DataImage.groups.data, Master);

          //On ajoute dans la base de données "MainData" le lien vers l'image master
          MainData[BaseFileNo].master = newFileMaster+DataImage.groups.extension;

          //On efface l'image en Base64 par un boléen 
          JsonValues.init_image = true;
        } else {
          //On efface l'image en Base64 par un boléen 
          JsonValues.init_image = false;
        }
        //On sauvegarde le JSON dans la base de données "MainData"
        MainData[BaseFileNo].data = JsonValues;
        console.log("Etape 2.4 : Fin de la mise à jour de la base de données JSON")
      }
    }
  });
  console.log("Etape 3 : Début de la Sauvegarde  de la base de données JSON")
  //On sauvegader sur les disque dur la base de données "MainData"
  fs.writeJSONSync(mainJson, MainData, { spaces: 4 });
  console.log("Etape 3 : Fin de la Sauvegarde  de la base de données JSON")

  console.log("Etape 4 : Début de la Sauvegarde de 'index.html'")
  //On Récupère la base de données "MainData" en format texte brute
  const TextMainData = fs.readFileSync(mainJson, { encoding: "utf-8" });

  //On met à jours le fichier "index.html" avec le JSON en format texte
  let Index = fs.readFileSync(IndexFile, { encoding: "utf-8" });
  fs.writeFileSync(path.join("SiteWeb", IndexFile),Index.replace("%%mainJson%%", TextMainData));
  console.log("Etape 4 : Fin de la Sauvegarde de 'index.html'")


  console.log("Etape 5 : Debut de la Sauvegarde de '%ID.html'")
  // Pour chaque éléments de la base de données
  for (const key in MainData) {
    
    //Sauf pour l'index "lastNb"
    if (Object.hasOwnProperty.call(MainData, key) && key != "lastNb") {
      
      //On récupére les données
      const element = MainData[key];

      //On lit le fichier template "SubPageFile"
      let SubPage = fs.readFileSync(SubPageFile, { encoding: "utf-8" });
      //On crée une varialbe qui sera la listre des paramètres de génération de l'image
      let LesItems = ""
      //Pour chaque élément des paramètres de génération de l'image 
      for (const key2 in element.data) {
        // SI la propiété exsite 
        if (Object.hasOwnProperty.call(element.data, key2)) {
          //On récupére la donnée
          const element2 = element.data[key2];
          //On li le fichier template "ItemsFile"
          let Items = fs.readFileSync(ItemsFile, { encoding: "utf-8" });
          //On ajoute à "LesItems", le code HTML mise à a jour de "ItemsFile"
          LesItems=LesItems+Items.replaceAll("%%Titre%%",key2).replaceAll("%%Texte%%",element2.toString())
        }
      }
      //On écrit le fichier "%ID.html" avec les données générique mise à joure par rapport au données de "element" 
      fs.writeFileSync(path.join("SiteWeb", key+".html"),SubPage.replace("%%Items%%",LesItems).replaceAll("%%img%%",path.join("images",element.full)).replaceAll("%%Json%%",path.join("images",element.json)).replaceAll("%%Prompt%%",element.data.prompt));
  
    }
  }
  console.log("Etape 5 : Fin de la Sauvegarde de '%ID.html'")
});
