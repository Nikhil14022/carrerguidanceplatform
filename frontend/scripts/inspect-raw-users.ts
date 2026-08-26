import prisma from '../src/lib/prisma';

async function main() {
    console.log('--- RAW INSPECTION OF USER COLLECTION ---');
    const rawResult: any = await prisma.$runCommandRaw({
        find: 'User',
        filter: {}
    });

    const docs = rawResult.cursor?.firstBatch || [];
    console.log(`Found ${docs.length} raw user documents in User collection:`);
    
    for (const doc of docs) {
        console.log(`Email: ${doc.email} | ID: ${doc._id?.$oid || doc._id} | createdAt: ${JSON.stringify(doc.createdAt)} (${typeof doc.createdAt}) | updatedAt: ${JSON.stringify(doc.updatedAt)} (${typeof doc.updatedAt})`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
