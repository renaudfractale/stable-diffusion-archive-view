const fs = require("fs-extra");
let OldMainJson = fs.readJsonSync("./main.json");

let NewMainJson = new Object();
for (const key in OldMainJson) {
  if (Object.hasOwnProperty.call(OldMainJson, key)) {
    let element = OldMainJson[key];
    if (typeof element != "object") {
      NewMainJson[key] = element;
    } else {
      if (element.data["prompt"] == undefined) {
        let positive_prompt = "";
        if (element.data["positive_prompt"] != undefined) {
          positive_prompt = element.data["positive_prompt"];
        }

        let negative_prompt = "";
        if (element.data["negative_prompt"] != undefined) {
          negative_prompt = element.data["negative_prompt"];
        }

        let prompt = positive_prompt + " [" + negative_prompt + "]";
        console.log(key +" ==> "+prompt);
        element.data.prompt = prompt;
      }
      NewMainJson[key]=element
    }
  }
}

fs.writeJsonSync("./mainNew.json", NewMainJson, { spaces: 2 });
