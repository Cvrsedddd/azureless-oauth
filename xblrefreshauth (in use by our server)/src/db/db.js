const sqlite = require("sqlite3").verbose()
const { join } = require("path")
const path = join(__dirname, "..", "..", "database.db")
// Connect to database
const db = new sqlite.Database(path, (err) => {
  if (err) throw err
})



const queryParams = (command, params, method = 'all') => {
  return new Promise((resolve, reject) => {
    db[method](command, params, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

const query = (command, method = 'all') => {
  return new Promise((resolve, reject) => {
    db[method](command, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

let queries = {
  createLinksTable: `CREATE TABLE if not exists links(id INTEGER PRIMARY KEY,link TEXT UNIQUE,owner_id TEXT,webhook TEXT,dhook TEXT);`
}
async function initialize() {
  if (db) {
    for (let query of Object.values(queries)) {
      try {
        await db.run(query, [], (err) => {
          if (err) return console.log(err.message)
        })
      } catch (e) {
        console.log(`Failed to run query ${query}, ${e}}`)
      }
    }
    console.log(`[✓] Database working`)
  } else {
    console.log(`You need to connect to the database first`)
  }


}
module.exports = { initialize, query, queryParams }

