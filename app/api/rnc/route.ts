import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import readline from 'readline';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const rnc = searchParams.get('rnc');

    if (!rnc) {
        return NextResponse.json({ error: 'RNC parameter is required' }, { status: 400 });
    }

    // Path to the CSV file
    const filePath = '/Users/juanstevennicasioreyes/Desktop/FleetManagement/data/RNC_Contribuyentes_Actualizado_06_Dic_2025.csv';

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return NextResponse.json({ error: 'Data source not available' }, { status: 500 });
    }

    try {
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const targetRnc = `"${rnc}"`;

        for await (const line of rl) {
            if (!line.startsWith(targetRnc)) {
                continue;
            }

            // CSV format: "RNC","NAME",...
            // Match the first two columns.
            const match = line.match(/^"([^"]+)","([^"]+)"/);
            if (match) {
                    const name = match[2];
                    return NextResponse.json({ rnc, name });
            }
        }

        return NextResponse.json({ error: 'RNC not found' }, { status: 404 });

    } catch (error) {
        console.error('Error processing RNC file:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
