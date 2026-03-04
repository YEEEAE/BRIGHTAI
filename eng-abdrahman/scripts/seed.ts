import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { parseISO } from 'date-fns'

const prisma = new PrismaClient()

interface RawCSVRow {
    Date: string
    DocNo: string
    'Machine Name': string
    'Producted Item.Code': string
    'Producted Item.Name': string
    'Producted Qty': string
    'Quantity (Rejected)': string
    'Reject %': string
    'RM TYPE': string
}

async function main() {
    console.log('Start seeding...')
    const results: any[] = []

    // read from public/data.csv
    const csvFilePath = path.join(__dirname, '../public/data.csv')

    if (!fs.existsSync(csvFilePath)) {
        console.error('data.csv not found at', csvFilePath)
        return
    }

    await new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data: RawCSVRow) => {
                const dateStr = data.Date?.trim() || ''
                const date = dateStr ? parseISO(dateStr) : new Date(0)

                if (isNaN(date.getTime()) || date.getTime() === 0) return // skip invalid dates

                results.push({
                    date,
                    dateStr,
                    docNo: data.DocNo?.trim() || '',
                    machineName: data['Machine Name']?.trim() || '',
                    itemCode: data['Producted Item.Code']?.trim() || '',
                    itemName: data['Producted Item.Name']?.trim() || '',
                    producedQty: parseFloat(data['Producted Qty'] || '0') || 0,
                    rejectedQty: parseFloat(data['Quantity (Rejected)'] || '0') || 0,
                    rejectPct: parseFloat(data['Reject %'] || '0') || 0,
                    rmType: data['RM TYPE']?.trim() || '',
                })
            })
            .on('end', () => resolve(true))
            .on('error', reject)
    })

    console.log(`Parsed ${results.length} rows. Inserting into DB...`)

    await prisma.qCRecord.deleteMany()

    // chunked insert
    const chunkSize = 200;
    for (let i = 0; i < results.length; i += chunkSize) {
        const chunk = results.slice(i, i + chunkSize);
        await prisma.qCRecord.createMany({
            data: chunk
        });
        console.log(`Inserted ${Math.min(i + chunk.length, results.length)} / ${results.length}`)
    }

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
