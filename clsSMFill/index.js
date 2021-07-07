const functions = {
    addRecord : (listItem) => listItem.replace(/[^a-zA-Z]/g,""), 
    updateXml : (value) => value,
    emptyValue : (value) => {
        if(value == "") {
            return null;
        } else {
           this.concatValue;
        }
    },
    concatValue : (value) => value.replace(value,`%{${value}}%`),
}
module.exports = functions;