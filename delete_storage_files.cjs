const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qrznzjxqsklyzutvumtq.supabase.co';
const supabaseKey = 'sb_publishable_kwmQ9BcbIOTG7PRfVNs_ZA_rwnslyc9';

const sb = createClient(supabaseUrl, supabaseKey);

async function cleanBucket(bucketName) {
  console.log(`Checking bucket: ${bucketName}...`);
  const { data: rootItems, error: rootError } = await sb.storage.from(bucketName).list();
  if (rootError) {
    console.error(`Error listing ${bucketName}:`, rootError.message);
    return;
  }

  if (!rootItems || rootItems.length === 0) {
    console.log(`Bucket ${bucketName} is already empty.`);
    return;
  }

  const allPaths = [];

  for (const item of rootItems) {
    // If it is a folder, list its contents
    if (!item.metadata || item.id === null) {
      const { data: folderItems } = await sb.storage.from(bucketName).list(item.name);
      if (folderItems && folderItems.length > 0) {
        for (const file of folderItems) {
          allPaths.push(`${item.name}/${file.name}`);
        }
      }
    } else {
      allPaths.push(item.name);
    }
  }

  if (allPaths.length === 0) {
    console.log(`No files found in bucket ${bucketName}.`);
    return;
  }

  console.log(`Deleting ${allPaths.length} file(s) from bucket ${bucketName}...`);
  const { data: deleted, error: deleteError } = await sb.storage.from(bucketName).remove(allPaths);
  if (deleteError) {
    console.error(`Failed to delete files in ${bucketName}:`, deleteError.message);
  } else {
    console.log(`Successfully deleted ${deleted?.length || allPaths.length} file(s) from ${bucketName}:`, deleted);
  }
}

async function main() {
  await cleanBucket('materials');
  await cleanBucket('avatars');
  console.log('Storage cleanup complete.');
}

main().catch(console.error);
