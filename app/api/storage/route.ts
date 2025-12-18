import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const DB_PATH = '/Users/juanstevennicasioreyes/Desktop/FleetManagement/data/db.json';

function getDB() {
    if (!fs.existsSync(DB_PATH)) {
        return {};
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error("DB Parse Error", e);
        return {};
    }
}

function saveDB(data: any) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const collection = searchParams.get('collection');

    try {
        const db = getDB();
        if (collection) {
            return NextResponse.json(db[collection] || []);
        }
        return NextResponse.json(db);
    } catch (error) {
        console.error("Storage Read Error:", error);
        return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { collection, data } = body;

        if (!collection) {
            return NextResponse.json({ error: 'Missing collection' }, { status: 400 });
        }

        const db = getDB();
        db[collection] = data;
        saveDB(db);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Storage Write Error:", error);
         return NextResponse.json({ error: 'Failed to save database' }, { status: 500 });
    }
}
