import {
    parseMinecraftListOutput,
    parseMinecraftPlayerNamesLine,
    parseMinecraftProperties,
    serializeMinecraftProperties,
    minecraftBuildDownloadSize,
    minecraftBuildLabel,
    minecraftBuildRequiresArchive,
} from '@/api/server/minecraft';

describe('@/api/server/minecraft.ts', function () {
    describe('parseMinecraftListOutput()', function () {
        it('parses common Java list output', function () {
            expect(parseMinecraftListOutput('There are 2 of a max of 20 players online: Steve, Alex')).toEqual({
                online: 2,
                max: 20,
                players: ['Steve', 'Alex'],
            });
        });

        it('parses empty player output', function () {
            expect(parseMinecraftListOutput('[12:00:00 INFO]: There are 0 of a max of 10 players online:')).toEqual({
                online: 0,
                max: 10,
                players: [],
            });
        });

        it('parses slash-style list output used by older servers', function () {
            expect(parseMinecraftListOutput('[19:47:47] [Server thread/INFO]: There are 1/20 players online:')).toEqual(
                {
                    online: 1,
                    max: 20,
                    players: [],
                }
            );
        });

        it('parses names from the following console line', function () {
            expect(parseMinecraftPlayerNamesLine('[19:47:47] [Server thread/INFO]: zNippw, Steve')).toEqual([
                'zNippw',
                'Steve',
            ]);
        });
    });

    describe('server.properties helpers', function () {
        it('preserves comments and unknown keys when serializing', function () {
            const parsed = parseMinecraftProperties('# hello\nmotd=Old\ncustom-key=value');

            expect(serializeMinecraftProperties(parsed, { ...parsed.values, motd: 'New' }, ['motd'])).toBe(
                '# hello\nmotd=New\ncustom-key=value'
            );
        });
    });

    describe('version helpers', function () {
        it('detects archive-based builds', function () {
            expect(
                minecraftBuildRequiresArchive({
                    id: 1,
                    version: '1.21.4',
                    type: 'FORGE',
                    experimental: false,
                    installation: [[{ type: 'download', file: 'server.zip' }], [{ type: 'unzip', file: 'server.zip' }]],
                    changes: [],
                })
            ).toBe(true);
        });

        it('formats build label and download size', function () {
            const build = {
                id: 1,
                version: '1.21.4',
                type: 'PAPER',
                experimental: false,
                name: '#232',
                jar_size: 1024,
                installation: [],
                changes: [],
            };

            expect(minecraftBuildLabel(build)).toBe('#232');
            expect(minecraftBuildDownloadSize(build)).toBe(1024);
        });
    });
});
