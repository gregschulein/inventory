import express from 'express';
import bodyParser from 'body-parser';
import { Low, JSONFile } from 'lowdb';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'data/db.json');

const adapter = new JSONFile(file);
const db = new Low(adapter);

// Initialize DB
await db.read();
db.data ||= { items: [] };

const app = express();

app.use(express.static(join(__dirname, 'static')));
app.use(express.static(join(__dirname, 'views')));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/search', (req, res) => {
    const query = req.query.q?.trim();
    
    if (!query) {
        res.redirect('/');
    } else if (query === '*') {
        res.render('search', { terms: query, items: db.data.items });
    } else {
        const terms = query.split(/\s+/);
        const result = db.data.items.filter(item => match(item, terms));
        res.render('search', { terms: query, items: result });
    }
});

app.get('/add', (req, res) => {
    res.render('add');
});

app.post('/add', async (req, res) => {
    try {
        const item = { 
            id: nextId(db.data.items),
            description: req.body.description,
            location: req.body.location,
            keywords: req.body.keywords 
        };

        db.data.items.push(item);
        await db.write();

        res.redirect('/');
    } catch (error) {
        console.error("Failed to add item:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/edit', (req, res) => {
    const reqId = parseInt(req.query.id, 10);
    const item = db.data.items.find(element => element.id === reqId);
    
    if (!item) {
        return res.status(404).send("Item not found");
    }

    res.render('edit', { 
        id: item.id,
        description: item.description,
        location: item.location,
        keywords: item.keywords 
    });
});

app.post('/edit', async (req, res) => {
    try {
        const reqId = parseInt(req.body.id, 10);
        const item = db.data.items.find(element => element.id === reqId);

        if (item) {
            item.description = req.body.description;
            item.location = req.body.location;
            item.keywords = req.body.keywords;
            await db.write();
        }

        res.redirect('/');
    } catch (error) {
        console.error("Failed to edit item:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/delete', async (req, res) => {
    try {
        const reqId = parseInt(req.body.id, 10);
        const index = db.data.items.findIndex(element => element.id === reqId);

        if (index !== -1) {
            db.data.items.splice(index, 1);
            await db.write();
        }

        res.redirect('/');
    } catch (error) {
        console.error("Failed to delete item:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});

// Graceful shutdowns
process.on('SIGINT', () => {
    console.info("Exiting on SIGINT");
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.info("Exiting on SIGTERM");
    process.exit(0);
});

function match(item, terms) {
    // .every() ensures ALL terms must match at least one field
    return terms.every(term => {
        const lowerTerm = term.toLowerCase();
        return item.description.toLowerCase().includes(lowerTerm) ||
               item.location.toLowerCase().includes(lowerTerm) ||
               item.keywords.toLowerCase().includes(lowerTerm);
    });
}

function nextId(items) {
    // Create a Set of existing IDs for O(1) lookups
    const existingIds = new Set(items.map(item => item.id));
    
    let i = 0;
    // Iterate upwards until we find an ID that isn't in the set
    while (existingIds.has(i)) {
        i++;
    }
    
    return i;
}
