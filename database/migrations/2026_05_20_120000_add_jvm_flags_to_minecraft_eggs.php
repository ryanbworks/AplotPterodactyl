<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    private const DEFAULT_FLAGS = '-Xms128M -XX:MaxRAMPercentage=95.0';

    private array $startups = [
        'Paper' => [
            'from' => 'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}',
            'to' => 'java {{JVM_FLAGS}} -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}',
        ],
        'Vanilla Minecraft' => [
            'from' => 'java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}',
            'to' => 'java {{JVM_FLAGS}} -jar {{SERVER_JARFILE}}',
        ],
        'Forge Minecraft' => [
            'from' => 'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true $( [[  ! -f unix_args.txt ]] && printf %s "-jar {{SERVER_JARFILE}}" || printf %s "@unix_args.txt" )',
            'to' => 'java {{JVM_FLAGS}} -Dterminal.jline=false -Dterminal.ansi=true $( [[  ! -f unix_args.txt ]] && printf %s "-jar {{SERVER_JARFILE}}" || printf %s "@unix_args.txt" )',
        ],
        'Bungeecord' => [
            'from' => 'java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}',
            'to' => 'java {{JVM_FLAGS}} -jar {{SERVER_JARFILE}}',
        ],
        'Sponge (SpongeVanilla)' => [
            'from' => 'java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}',
            'to' => 'java {{JVM_FLAGS}} -jar {{SERVER_JARFILE}}',
        ],
    ];

    public function up(): void
    {
        foreach ($this->startups as $eggName => $startup) {
            $egg = DB::table('eggs')->where('name', $eggName)->first(['id', 'startup']);

            if (!$egg) {
                continue;
            }

            if ($egg->startup === $startup['from']) {
                DB::table('eggs')->where('id', $egg->id)->update(['startup' => $startup['to']]);
            }

            DB::table('egg_variables')->updateOrInsert(
                [
                    'egg_id' => $egg->id,
                    'env_variable' => 'JVM_FLAGS',
                ],
                [
                    'name' => 'JVM Flags',
                    'description' => 'Flags adicionais da JVM para ajustar performance, GC e memória. Pode usar Aikar Flags aqui.',
                    'default_value' => self::DEFAULT_FLAGS,
                    'user_viewable' => true,
                    'user_editable' => true,
                    'rules' => 'nullable|string|max:2048',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    public function down(): void
    {
        foreach ($this->startups as $eggName => $startup) {
            $egg = DB::table('eggs')->where('name', $eggName)->first(['id', 'startup']);

            if (!$egg) {
                continue;
            }

            if ($egg->startup === $startup['to']) {
                DB::table('eggs')->where('id', $egg->id)->update(['startup' => $startup['from']]);
            }

            DB::table('egg_variables')
                ->where('egg_id', $egg->id)
                ->where('env_variable', 'JVM_FLAGS')
                ->delete();
        }
    }
};
