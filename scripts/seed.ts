import "dotenv/config";
import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "../lib/db/schema";

async function seed() {
  const db = drizzle(sql, { schema });

  console.log("🌱 Seeding database...");

  // 1. Create languages
  console.log("  → Languages...");
  const langs = [
    { code: "te", name: "Telugu", nativeName: "తెలుగు", sortOrder: 0 },
    { code: "en", name: "English", nativeName: "English", sortOrder: 1 },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", sortOrder: 2 },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", sortOrder: 3 },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം", sortOrder: 4 },
    
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", sortOrder: 5 },
  ];

  for (const lang of langs) {
    await db
      .insert(schema.languages)
      .values({ ...lang, isActive: true })
      .onConflictDoNothing();
  }

  // 2. Create sample songs
  console.log("  → Songs...");
  const songs = [
    {
      slug: "amazing-grace",
      category: "Hymns",
      translations: [
        {
          languageCode: "en",
          title: "Amazing Grace",
          lyrics: `Amazing grace, how sweet the sound
That saved a wretch like me!
I once was lost, but now am found,
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved.
How precious did that grace appear
The hour I first believed.

Through many dangers, toils, and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.

The Lord has promised good to me,
His word my hope secures.
He will my shield and portion be
As long as life endures.

When we've been there ten thousand years,
Bright shining as the sun,
We've no less days to sing God's praise
Than when we first begun.`,
        },
        {
          languageCode: "te",
          title: "అద్భుత కృప",
          lyrics: `అద్భుత కృప, ఎంత మధురమైన శబ్దం
నా వంటి పాపిని రక్షించింది!
నేను ఒకప్పుడు తప్పిపోయాను, కానీ ఇప్పుడు దొరికాను,
గుడ్డివాడను, కానీ ఇప్పుడు చూస్తున్నాను.

కృపే నా హృదయానికి భయం నేర్పించింది,
కృపే నా భయాలను తొలగించింది.
ఆ కృప ఎంత అమూల్యంగా కనిపించింది
నేను మొదట నమ్మిన ఆ గంట.`,
          englishMeaning: `God's amazing grace is so sweet that it saved a sinner like me. I was once lost, but now I have been found. I was blind, but now I can see. It was grace that taught my heart reverence and removed my fears. That grace became precious to me from the very moment I first believed.`,
        },
      ],
    },
    {
      slug: "how-great-thou-art",
      category: "Worship",
      translations: [
        {
          languageCode: "en",
          title: "How Great Thou Art",
          lyrics: `O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made,
I see the stars, I hear the rolling thunder,
Thy power throughout the universe displayed.

Then sings my soul, my Savior God, to Thee:
How great Thou art! How great Thou art!
Then sings my soul, my Savior God, to Thee:
How great Thou art! How great Thou art!

When through the woods and forest glades I wander
And hear the birds sing sweetly in the trees,
When I look down from lofty mountain grandeur
And hear the brook and feel the gentle breeze.

Then sings my soul, my Savior God, to Thee:
How great Thou art! How great Thou art!
Then sings my soul, my Savior God, to Thee:
How great Thou art! How great Thou art!`,
        },
        {
          languageCode: "te",
          title: "ఎంత గొప్పవాడవు",
          lyrics: `ఓ ప్రభువా నా దేవా, నేను అద్భుతంతో
నీ చేతులు చేసిన లోకాలన్నిటినీ ఆలోచించినప్పుడు,
నక్షత్రాలను చూస్తాను, ఉరుముల శబ్దం విన్నాను,
విశ్వమంతా నీ శక్తి ప్రదర్శించబడింది.

అప్పుడు నా ఆత్మ పాడుతుంది, నా రక్షకుడైన దేవా, నీకు:
ఎంత గొప్పవాడవు! ఎంత గొప్పవాడవు!
అప్పుడు నా ఆత్మ పాడుతుంది, నా రక్షకుడైన దేవా, నీకు:
ఎంత గొప్పవాడవు! ఎంత గొప్పవాడవు!`,
          englishMeaning: `When I think about the worlds God created and see the stars, thunder, and all creation, my soul responds in worship. The song declares that God's greatness is seen throughout the universe, and the heart cannot help but sing that He is truly great.`,
        },
      ],
    },
    {
      slug: "blessed-assurance",
      category: "Hymns",
      translations: [
        {
          languageCode: "en",
          title: "Blessed Assurance",
          lyrics: `Blessed assurance, Jesus is mine!
Oh, what a foretaste of glory divine!
Heir of salvation, purchase of God,
Born of His Spirit, washed in His blood.

This is my story, this is my song,
Praising my Savior all the day long;
This is my story, this is my song,
Praising my Savior all the day long.

Perfect submission, perfect delight,
Visions of rapture now burst on my sight;
Angels descending, bring from above
Echoes of mercy, whispers of love.

This is my story, this is my song,
Praising my Savior all the day long;
This is my story, this is my song,
Praising my Savior all the day long.`,
        },
      ],
    },
    {
      slug: "great-is-thy-faithfulness",
      category: "Worship",
      translations: [
        {
          languageCode: "en",
          title: "Great Is Thy Faithfulness",
          lyrics: `Great is Thy faithfulness, O God my Father;
There is no shadow of turning with Thee.
Thou changest not, Thy compassions, they fail not;
As Thou hast been, Thou forever wilt be.

Great is Thy faithfulness!
Great is Thy faithfulness!
Morning by morning new mercies I see;
All I have needed Thy hand hath provided.
Great is Thy faithfulness, Lord, unto me!

Summer and winter and springtime and harvest,
Sun, moon, and stars in their courses above
Join with all nature in manifold witness
To Thy great faithfulness, mercy, and love.

Great is Thy faithfulness!
Great is Thy faithfulness!
Morning by morning new mercies I see;
All I have needed Thy hand hath provided.
Great is Thy faithfulness, Lord, unto me!`,
        },
        {
          languageCode: "hi",
          title: "महान है तेरी विश्वासयोग्यता",
          lyrics: `महान है तेरी विश्वासयोग्यता, हे मेरे पिता परमेश्वर;
तेरे साथ बदलाव की कोई छाया नहीं।
तू बदलता नहीं, तेरी करुणा, वे विफल नहीं होतीं;
जैसा तू रहा है, तू सदा रहेगा।

महान है तेरी विश्वासयोग्यता!
महान है तेरी विश्वासयोग्यता!
प्रात: प्रात: नई दया मैं देखता हूँ;
जो कुछ मुझे चाहिए था तेरे हाथ ने प्रदान किया।
महान है तेरी विश्वासयोग्यता, प्रभु, मेरे लिए!`,
          englishMeaning: `This song praises God for His unchanging nature and constant faithfulness. His mercy never fails, and every morning brings new compassion. Everything needed in life comes from His hand, so the singer joyfully declares that the Lord has been faithful in every season.`,
        },
      ],
    },
    {
      slug: "what-a-friend-we-have-in-jesus",
      category: "Praise",
      translations: [
        {
          languageCode: "en",
          title: "What a Friend We Have in Jesus",
          lyrics: `What a friend we have in Jesus,
All our sins and griefs to bear!
What a privilege to carry
Everything to God in prayer!

Oh, what peace we often forfeit,
Oh, what needless pain we bear,
All because we do not carry
Everything to God in prayer!

Have we trials and temptations?
Is there trouble anywhere?
We should never be discouraged—
Take it to the Lord in prayer.

Can we find a friend so faithful,
Who will all our sorrows share?
Jesus knows our every weakness;
Take it to the Lord in prayer.`,
        },
      ],
    },
  ];

  for (const songData of songs) {
    const [song] = await db
      .insert(schema.songs)
      .values({
        slug: songData.slug,
        category: songData.category,
        defaultLang: "en",
        isPublished: true,
      })
      .onConflictDoNothing()
      .returning();

    if (song) {
      for (const trans of songData.translations) {
        await db
          .insert(schema.songTranslations)
          .values({
            songId: song.id,
            languageCode: trans.languageCode,
            title: trans.title,
            lyrics: trans.lyrics,
            englishMeaning: trans.englishMeaning ?? null,
          })
          .onConflictDoNothing();
      }

      // Update search vectors
      await sql.query(
        `UPDATE song_translations SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(lyrics, '')) WHERE song_id = $1`,
        [song.id]
      );
    }
  }

  console.log("  → Done seeding!");
  console.log("");
  console.log("📋 Summary:");
  console.log(`   ${langs.length} languages`);
  console.log(`   ${songs.length} songs`);
  console.log("");
  console.log("🔑 To generate admin password hash, run:");
  console.log('   node -e "require(\'bcryptjs\').hash(\'yourpassword\',12).then(h=>console.log(h))"');

  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
