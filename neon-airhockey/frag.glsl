//  Idea From FiTH Remade By Cole Kissane
//coler706@gmail.com
//coler706.github.io

#ifdef GL_ES
precision mediump float;
#endif

#extension GL_OES_standard_derivatives : enable

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                             *
 *                        Neon Air Hockey                      *
 *                                                             *
 *                                                             *
 *                  Parameters for game control                *
 *                                                             *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//#define USE_DELAY           //  comment this line for faster game
#define START_GAME_DELAY 6  //  delay before start new game
#define BOT_SPEED 0.008      //  bot move speed

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backbuffer;  //  need for data storage

//  game data
vec2 ball_pos;
vec2 ball_dir;
vec2 bot_pos;
vec2 player_pos;
vec2 last_player_pos;
float player_score;
float bot_score;
float start_game;
bool is_tick;

//  game data save direction
//  all data is stored in the bottom left corner
const vec2 init_data_pos = vec2(0.0, 0.0);  //  is data init ?
const vec2 time_data_pos = vec2(0.0, 1.0);
const vec2 ball_pos_data_pos = vec2(1.0, 0.0);
const vec2 ball_dir_data_pos = vec2(2.0, 0.0);
const vec2 bot_pos_data_pos = vec2(1.0, 1.0);
const vec2 bot_pos_data_pos2 = vec2(3.0, 0.0);
const vec2 player_score_data_pos = vec2(0.0, 2.0);
const vec2 bot_score_data_pos = vec2(1.0, 2.0);
const vec2 start_game_data_pos = vec2(2.0, 1.0);
const vec2 last_player_x_data_pos = vec2(3.0, 1.0);
const vec2 last_player_y_data_pos = vec2(3.0, 2.0);

//  game param
const float data_size = 5.0;  //  float is not very accurate, so we write down information in a lot of pixels, and read from the center of this area
const float bot_speed = BOT_SPEED;
const float ball_size = 0.025;
const float pi = atan(1.0) * 4.;
const float ball_velocity_target = 0.01;

float scale = 1.0; // svg in range [0,100]x[0,56.25]

float epsilon = 1e-4;
float infinity = 1e6;
float screenHeight = 0.5;
float screenWidth = 0.9;
float paddle_height = 0.1;
float object_padding = 0.025;
float collision_padding = 0.01;
float paddle_width = 0.1;

#define BRIGHTNESS 8e-3
#define THICKNESS  1e-3
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float flicker(float time) {
    return rand(vec2(time, 0.));
}

bool is_data_pos(vec2 pos) {
    if(gl_FragCoord.x > data_size * pos.x && gl_FragCoord.x < data_size * (pos.x + 1.0) && gl_FragCoord.y > data_size * pos.y && gl_FragCoord.y < data_size * (pos.y + 1.0))
        return true;

    return false;
}

void count_down_for_start() {
    bool temp = int(time * 1000.0) - (int(time * 1000.0) / START_GAME_DELAY) * START_GAME_DELAY == 0;  //  remove for faster game

    if(temp && is_tick) {
        is_tick = false;
    } else if(!temp) {
        is_tick = true;
        return;
    }

    ball_pos = vec2(0.5);
    ball_dir = (vec2(cos(time * 4.0) > -0.2 ? 0.515 : 0.485, sin(time / 2.0) < 0.3 ? 0.515 : 0.485) - vec2(0.5)) / 2.0 + vec2(0.5);
    bot_pos = vec2(0.5 + screenWidth / 2.0 - paddle_width / 2.0 - object_padding, 0.5);
    start_game -= 0.1;
}
vec2 fromScreen(vec2 field) {
    return (field - vec2(0.5)) * resolution.xy / min(resolution.x, resolution.y) + vec2(0.5);
}
void update() {
	//  move ball
    ball_dir -= vec2(0.5);

    vec2 oldBotPos = bot_pos;
	//  control bot
    if(bot_pos.y + 0.05 < ball_pos.y) {
        bot_pos.y += bot_speed;

    } else if(bot_pos.y - 0.05 > ball_pos.y) {
        bot_pos.y -= bot_speed;

    }
    if(bot_pos.x + 0.05 < ball_pos.x) {
        bot_pos.x += bot_speed;

    } else if(bot_pos.x - 0.05 > ball_pos.x) {
        bot_pos.x -= bot_speed;

    }
    bot_pos.y = max(min(bot_pos.y, 0.5 + screenHeight / 2.0 - paddle_height / 2.0 - object_padding), 0.5 - screenHeight / 2.0 + paddle_height / 2.0 + object_padding);
    bot_pos.x = max(min(bot_pos.x, 0.5 + screenWidth / 2.0 - paddle_width / 2.0 - object_padding), 0.5 + paddle_width / 2.0);

    vec2 lastInterpPos = last_player_pos;
    vec2 lastInterpBotPos = oldBotPos;
    for(float i = 0.0; i <= 1.0; i += 1.0 / 100.0) {

        ball_dir = ball_dir * 0.9 + (1.0 - 0.9) * normalize(ball_dir) * ball_velocity_target;
        ball_pos.x += ball_dir.x / 100.0;
        ball_pos.y += ball_dir.y / 100.0;
        vec2 interpPlayerPos = player_pos * (1.0 - i) + last_player_pos * i;
        vec2 interpBotPos = bot_pos * (1.0 - i) + oldBotPos * i;
        vec2 sub_pos_p2 = vec2(interpBotPos.x, min(max(interpBotPos.y - paddle_height / 2.0 + paddle_width / 2.0, ball_pos.y), interpBotPos.y + paddle_height / 2.0 - paddle_width / 2.0));
        if(distance(sub_pos_p2, ball_pos) <= ball_size + paddle_width / 2.0 + collision_padding) {
            vec2 paddleNormal = normalize(ball_pos - sub_pos_p2);
            if(dot(paddleNormal, ball_dir) < 0.0) {
                ball_dir += paddleNormal * 2.0 * abs(dot(paddleNormal, ball_dir));
            }
            ball_pos += normalize(ball_pos - sub_pos_p2) * (ball_size + paddle_width / 2.0 + collision_padding - distance(sub_pos_p2, ball_pos));
            if(dot(paddleNormal, interpBotPos - lastInterpBotPos) > 0.0) {
                ball_dir += paddleNormal * abs(dot(paddleNormal, interpBotPos - lastInterpBotPos));
            }
        }
        vec2 sub_pos_p1 = vec2(interpPlayerPos.x, min(max(interpPlayerPos.y - paddle_height / 2.0 + paddle_width / 2.0, ball_pos.y), interpPlayerPos.y + paddle_height / 2.0 - paddle_width / 2.0));
        if(distance(sub_pos_p1, ball_pos) <= ball_size + paddle_width / 2.0 + collision_padding) {
            vec2 paddleNormal = normalize(ball_pos - sub_pos_p1);
            if(dot(paddleNormal, ball_dir) < 0.0) {
                ball_dir += paddleNormal * 2.0 * abs(dot(paddleNormal, ball_dir));
            }
            ball_pos += normalize(ball_pos - sub_pos_p1) * (ball_size + paddle_width / 2.0 + collision_padding - distance(sub_pos_p1, ball_pos));
            if(dot(paddleNormal, interpPlayerPos - lastInterpPos) > 0.0) {
                ball_dir += paddleNormal * abs(dot(paddleNormal, interpPlayerPos - lastInterpPos));
            }
        }
        lastInterpPos = interpPlayerPos;
        lastInterpBotPos = interpBotPos;
        if(ball_pos.y + ball_size + collision_padding >= 0.5 + screenHeight / 2.0 && ball_dir.y > 0.0) {
            ball_dir.y = 0.0 - ball_dir.y;
            ball_pos.y = 0.5 + screenHeight / 2.0 - ball_size - collision_padding;
        } else if(ball_pos.y - ball_size - collision_padding <= 0.5 - screenHeight / 2.0 && ball_dir.y < 0.0) {
            ball_dir.y = 0.0 - ball_dir.y;
            ball_pos.y = 0.5 - screenHeight / 2.0 + ball_size + collision_padding;
        }
    }
    if(ball_pos.x + ball_size >= 0.5 + screenWidth / 2.0 && ball_dir.x > 0.0) {  //  bot lose
        start_game = 1.0;
        player_score += 0.1;
        if(player_score > 0.4) {
            bot_score = 0.0;
            player_score = 0.0;
        }
    } else if(ball_pos.x - ball_size <= 0.5 - screenWidth / 2.0 && ball_dir.x < 0.0) {  //  player lose
        start_game = 1.0;
        bot_score += 0.1;
        if(bot_score > 0.4) {
            bot_score = 0.0;
            player_score = 0.0;
        }
    }

	//  ball hit top or bottom

    ball_dir += vec2(0.5);
}

void init_or_read() {
    float player_y = max(min(fromScreen(mouse).y, 0.5 + screenHeight / 2.0 - paddle_height / 2.0 - object_padding), 0.5 - screenHeight / 2.0 + paddle_height / 2.0 + object_padding);
    float player_x = max(min(fromScreen(mouse).x, 0.5 - paddle_width / 2.0), 0.5 - screenWidth / 2.0 + paddle_width / 2.0 + object_padding);
    player_pos = vec2(player_x, player_y);
    if(texture2D(backbuffer, data_size * (init_data_pos + 0.5) / resolution)[0] < 0.9) {
        ball_pos = vec2(0.5);
        bot_pos = vec2(0.5 + screenWidth / 2.0 - paddle_width / 2.0 - object_padding, 0.5);
        last_player_pos = vec2(0.5 - screenWidth / 2.0 + paddle_width / 2.0 + object_padding, 0.5);
        bot_score = 0.0;
        player_score = 0.0;
        start_game = 1.0;
    } else {
        ball_pos = texture2D(backbuffer, data_size / resolution * (ball_pos_data_pos + vec2(0.5))).rg;
        ball_dir = texture2D(backbuffer, data_size / resolution * (ball_dir_data_pos + vec2(0.5))).rg;
        bot_pos = vec2(texture2D(backbuffer, data_size / resolution * (bot_pos_data_pos2 + vec2(0.5))).r, texture2D(backbuffer, data_size / resolution * (bot_pos_data_pos + vec2(0.5))).r);
        last_player_pos = vec2(texture2D(backbuffer, data_size / resolution * (last_player_x_data_pos + vec2(0.5))).r, texture2D(backbuffer, data_size / resolution * (last_player_y_data_pos + vec2(0.5))).r);
        player_score = texture2D(backbuffer, data_size / resolution * (player_score_data_pos + vec2(0.5))).r;
        bot_score = texture2D(backbuffer, data_size / resolution * (bot_score_data_pos + vec2(0.5))).r;
        is_tick = texture2D(backbuffer, data_size / resolution * (time_data_pos + vec2(0.5))).r > 0.5;
        start_game = texture2D(backbuffer, data_size / resolution * (start_game_data_pos + vec2(0.5))).r;
    }

    if(is_data_pos(init_data_pos))
        gl_FragColor = vec4(1.0);
}

void tick() {

    if(start_game > 0.0) {
        count_down_for_start();
    } else {

#ifdef USE_DELAY
        bool temp = int(time * 1000.0) - (int(time * 1000.0) / 2) * 2 == 0;  //  remove for faster game

        if(temp && is_tick) {
            update();
            is_tick = false;
        } else if(!temp) {
            is_tick = true;
        }
#else
        update();
#endif
    }
}

void saveData() {
    if(is_data_pos(ball_pos_data_pos)) {
        gl_FragColor = vec4(ball_pos, vec2(0.0));
    }

    if(is_data_pos(ball_dir_data_pos)) {
        gl_FragColor = vec4(ball_dir, vec2(0.0));
    }

    if(is_data_pos(bot_pos_data_pos)) {
        gl_FragColor = vec4(bot_pos.y, vec3(0.0));
    }
    if(is_data_pos(bot_pos_data_pos2)) {
        gl_FragColor = vec4(bot_pos.x, vec3(0.0));
    }

    if(is_data_pos(last_player_x_data_pos)) {
        gl_FragColor = vec4(player_pos.x, vec3(0.0));
    }
    if(is_data_pos(last_player_y_data_pos)) {
        gl_FragColor = vec4(player_pos.y, vec3(0.0));
    }

    if(is_data_pos(player_score_data_pos)) {
        gl_FragColor = vec4(player_score, vec3(0.0));
    }

    if(is_data_pos(bot_score_data_pos)) {
        gl_FragColor = vec4(bot_score, vec3(0.0));
    }

    if(is_data_pos(time_data_pos)) {
        gl_FragColor = vec4(is_tick ? 1.0 : 0.0, vec3(0.0));
    }

    if(is_data_pos(start_game_data_pos)) {
        gl_FragColor = vec4(start_game, vec3(0.0));
    }
}

void drawScore() {
    for(float i = 0.0; i < 0.4; i += 0.1) {
        if(i < player_score) {
            if(distance(gl_FragCoord.xy, vec2((i * 0.5 + 0.05) * resolution.x, 0.95 * resolution.y)) < 0.011 * resolution.x)
                gl_FragColor = vec4(smoothstep(0.011 * resolution.x, 0.01 * resolution.x, distance(gl_FragCoord.xy, vec2((i * 0.5 + 0.05) * resolution.x, 0.95 * resolution.y))), 0.0, 0.0, 1.0);
        }

        if(i < bot_score) {
            if(distance(gl_FragCoord.xy, vec2((0.95 - i * 0.5) * resolution.x, 0.95 * resolution.y)) < 0.011 * resolution.x)
                gl_FragColor = vec4(0.0, 0.0, smoothstep(0.011 * resolution.x, 0.01 * resolution.x, distance(gl_FragCoord.xy, vec2((0.95 - i * 0.5) * resolution.x, 0.95 * resolution.y))), 1.0);
        }
    }
}

float dfLine(vec2 start, vec2 end, vec2 uv) {
    start *= scale;
    end *= scale; // rescale

    vec2 line = end - start;
    float frac = dot(uv - start, line) / dot(line, line);
    return distance(start + line * clamp(frac, 0.0, 0.0 + (1.0 - start_game) * 0.0 + 1.0), uv);
}

float dfArc(vec2 origin, float start, float sweep, float radius, vec2 uv) {
    origin *= scale;
    radius *= scale; // rescale
    uv -= origin; // move
    sweep = -sweep * 1.0;//(1.0-start_game); // cw for svg
    uv *= mat2( // rotate to start
    cos(start), sin(start), -sin(start), cos(start));

    float offs = (sweep / 2.0 - pi);
    float ang = mod(atan(uv.y, uv.x) - offs, 2. * pi) + offs;
    ang = clamp(ang, min(0.0, sweep), max(0.0, sweep));

    return distance(radius * vec2(cos(ang), sin(ang)), uv);
}

float dfFrame(vec2 uv, vec2 left, vec2 right) {
    float dist = infinity;
    float r = 0.0125;	

	// Frame

	// bottom
    dist = min(dist, dfLine(vec2(left.x + r, left.y), vec2((right.x + left.x) / 2. - r, left.y), uv));
    dist = min(dist, dfLine(vec2((right.x + left.x) / 2. + r, left.y), vec2(right.x - r, left.y), uv));
    dist = min(dist, dfArc(vec2(right.x - r, left.y + r), 0., 1.57, r, uv));

	// right
    dist = min(dist, dfLine(vec2(right.x, left.y + r), vec2(right.x, right.y - r), uv));
    dist = min(dist, dfArc(vec2(right.x - r, right.y - r), 1.57, 1.57, r, uv));

	// top
    dist = min(dist, dfLine(vec2(right.x - r, right.y), vec2(left.x + r, right.y), uv));
    dist = min(dist, dfArc(vec2(left.x + r, right.y - r), -3.14, 1.57, r, uv));

	// left
    dist = min(dist, dfLine(vec2(left.x, right.y - r), vec2(left.x, left.y + r), uv));
    dist = min(dist, dfArc(vec2(left.x + r, left.y + r), -1.57, 1.57, r, uv));
    return dist;
}
float dfGameLeft(vec2 uv, vec2 left, vec2 right) {
    float dist = infinity;
    float r = object_padding + paddle_width / 2.0;	

	// Frame

	// bottom
    dist = min(dist, dfLine(vec2(left.x + r, left.y), vec2((right.x + left.x) / 2. - object_padding, left.y), uv));
	
	// top
    dist = min(dist, dfLine(vec2(left.x + r, right.y), vec2((right.x + left.x) / 2. - object_padding, right.y), uv));
    dist = min(dist, dfArc(vec2(left.x + r, right.y - r), -3.14, 1.57, r, uv));

	// left
    dist = min(dist, dfLine(vec2(left.x, right.y - r), vec2(left.x, left.y + r), uv));
    dist = min(dist, dfArc(vec2(left.x + r, left.y + r), -1.57, 1.57, r, uv));
    return dist;
}
float dfGameRight(vec2 uv, vec2 left, vec2 right) {
    float dist = infinity;
    float r = object_padding + paddle_width / 2.0;	

	// Frame

	// bottom
    dist = min(dist, dfLine(vec2((right.x + left.x) / 2. + object_padding, left.y), vec2(right.x - r, left.y), uv));
    dist = min(dist, dfArc(vec2(right.x - r, left.y + r), 0., 1.57, r, uv));

	// right
    dist = min(dist, dfLine(vec2(right.x, left.y + r), vec2(right.x, right.y - r), uv));
    dist = min(dist, dfArc(vec2(right.x - r, right.y - r), 1.57, 1.57, r, uv));

	// top
    dist = min(dist, dfLine(vec2((right.x + left.x) / 2. + object_padding, right.y), vec2(right.x - r, right.y), uv));
	//dist = min(dist, dfArc(vec2(left.x+r,right.y-r), -3.14, 1.57, r, uv));

    return dist;
}
float dfPlayer(vec2 uv) {
    float dist = infinity;
    float r = paddle_width / 2.0;
    vec2 left = vec2(player_pos.x - paddle_width / 2.0, player_pos.y - paddle_height / 2.0);
    vec2 right = vec2(player_pos.x + paddle_width / 2.0, player_pos.y + paddle_height / 2.0);
	// Frame

	// bottom
    dist = min(dist, dfLine(vec2(left.x + r, left.y), vec2(right.x - r, left.y), uv));
    dist = min(dist, dfArc(vec2(right.x - r, left.y + r), 0., 1.57, r, uv));

	// right
    dist = min(dist, dfLine(vec2(right.x, left.y + r), vec2(right.x, right.y - r), uv));
    dist = min(dist, dfArc(vec2(right.x - r, right.y - r), 1.57, 1.57, r, uv));

	// top
    dist = min(dist, dfLine(vec2(right.x - r, right.y), vec2(left.x + r, right.y), uv));
    dist = min(dist, dfArc(vec2(left.x + r, right.y - r), -3.14, 1.57, r, uv));

	// left
    dist = min(dist, dfLine(vec2(left.x, right.y - r), vec2(left.x, left.y + r), uv));
    dist = min(dist, dfArc(vec2(left.x + r, left.y + r), -1.57, 1.57, r, uv));
    return dist;
}
float dfBall(vec2 uv) {
    float dist = infinity;
    float r = ball_size / 2.0;

    vec2 left = ball_pos - ball_size / 2.0;
    vec2 right = ball_pos + ball_size / 2.0;
	// Frame

	// bottom
    dist = min(dist, dfLine(vec2(left.x + r, left.y), vec2(right.x - r, left.y), uv));
    dist = min(dist, dfArc(vec2(right.x - r, left.y + r), 0., 1.57, r, uv));

	// right
    dist = min(dist, dfLine(vec2(right.x, left.y + r), vec2(right.x, right.y - r), uv));
    dist = min(dist, dfArc(vec2(right.x - r, right.y - r), 1.57, 1.57, r, uv));

	// top
    dist = min(dist, dfLine(vec2(right.x - r, right.y), vec2(left.x + r, right.y), uv));
    dist = min(dist, dfArc(vec2(left.x + r, right.y - r), -3.14, 1.57, r, uv));

	// left
    dist = min(dist, dfLine(vec2(left.x, right.y - r), vec2(left.x, left.y + r), uv));
    dist = min(dist, dfArc(vec2(left.x + r, left.y + r), -1.57, 1.57, r, uv));
    return dist;
}
float dfCenterCountDownOff(vec2 uv, float count) {
    float dist = infinity;
    for(float i = 0.0; i < 3.0; i++) {
        if(i != floor(3.0 - count)) {

            float r = ball_size / 2.0 + object_padding * (2.0 * i + 2.0);
            vec2 left = vec2(0.5) - r;
            vec2 right = vec2(0.5) + r;
	// Frame

	// bottom

            dist = min(dist, dfArc(vec2(right.x - r, left.y + r), 0., 1.57, r, uv));

	// right

            dist = min(dist, dfArc(vec2(right.x - r, right.y - r), 1.57, 1.57, r, uv));

	// top

            dist = min(dist, dfArc(vec2(left.x + r, right.y - r), -3.14, 1.57, r, uv));

	// left

            dist = min(dist, dfArc(vec2(left.x + r, left.y + r), -1.57, 1.57, r, uv));
        }
    }
    return dist;
}
float dfScoreP1(vec2 uv, float count) {
    float dist = infinity;
    for(float i = 0.0; i < 5.0; i++) {
        if(i < count) {

            float r = object_padding;
            vec2 center = vec2(0.5 - screenWidth / 2.0 + r + (2.0 * r + object_padding) * i, 0.5 - screenHeight / 2.0 - r - object_padding);
            vec2 left = center - r;
            vec2 right = center + r;
	// Frame

	// bottom

            dist = min(dist, dfArc(vec2(right.x - r, left.y + r), 0., 1.57, r, uv));

	// right

            dist = min(dist, dfArc(vec2(right.x - r, right.y - r), 1.57, 1.57, r, uv));

	// top

            dist = min(dist, dfArc(vec2(left.x + r, right.y - r), -3.14, 1.57, r, uv));

	// left

            dist = min(dist, dfArc(vec2(left.x + r, left.y + r), -1.57, 1.57, r, uv));
        }
    }
    return dist;
}
float dfScoreP2(vec2 uv, float count) {
    float dist = infinity;
    for(float i = 0.0; i < 5.0; i++) {
        if(i < count) {

            float r = object_padding;
            vec2 center = vec2(0.5 + screenWidth / 2.0 - r - (2.0 * r + object_padding) * i, 0.5 - screenHeight / 2.0 - r - object_padding);
            vec2 left = center - r;
            vec2 right = center + r;
	// Frame

	// bottom

            dist = min(dist, dfArc(vec2(right.x - r, left.y + r), 0., 1.57, r, uv));

	// right

            dist = min(dist, dfArc(vec2(right.x - r, right.y - r), 1.57, 1.57, r, uv));

	// top

            dist = min(dist, dfArc(vec2(left.x + r, right.y - r), -3.14, 1.57, r, uv));

	// left

            dist = min(dist, dfArc(vec2(left.x + r, left.y + r), -1.57, 1.57, r, uv));
        }
    }
    return dist;
}
float dfCenterCountDown(vec2 uv, float count) {
    float dist = infinity;
    for(float i = 0.0; i < 3.0; i++) {
        if(i == floor(3.0 - count)) {

            float r = ball_size / 2.0 + object_padding * (2.0 * i + 2.0);
            vec2 left = vec2(0.5) - r;
            vec2 right = vec2(0.5) + r;
	// Frame

	// bottom

            dist = min(dist, dfArc(vec2(right.x - r, left.y + r), 0., 1.57, r, uv));

	// right

            dist = min(dist, dfArc(vec2(right.x - r, right.y - r), 1.57, 1.57, r, uv));

	// top

            dist = min(dist, dfArc(vec2(left.x + r, right.y - r), -3.14, 1.57, r, uv));

	// left

            dist = min(dist, dfArc(vec2(left.x + r, left.y + r), -1.57, 1.57, r, uv));
        }
    }
    return dist;
}
float dfBot(vec2 uv) {
    float dist = infinity;
    float r = paddle_width / 2.0;
    vec2 left = vec2(bot_pos.x - paddle_width / 2.0, bot_pos.y - paddle_height / 2.0);
    vec2 right = vec2(bot_pos.x + paddle_width / 2.0, bot_pos.y + paddle_height / 2.0);
	// Frame

	// bottom
    dist = min(dist, dfLine(vec2(left.x + r, left.y), vec2(right.x - r, left.y), uv));
    dist = min(dist, dfArc(vec2(right.x - r, left.y + r), 0., 1.57, r, uv));

	// right
    dist = min(dist, dfLine(vec2(right.x, left.y + r), vec2(right.x, right.y - r), uv));
    dist = min(dist, dfArc(vec2(right.x - r, right.y - r), 1.57, 1.57, r, uv));

	// top
    dist = min(dist, dfLine(vec2(right.x - r, right.y), vec2(left.x + r, right.y), uv));
    dist = min(dist, dfArc(vec2(left.x + r, right.y - r), -3.14, 1.57, r, uv));

	// left
    dist = min(dist, dfLine(vec2(left.x, right.y - r), vec2(left.x, left.y + r), uv));
    dist = min(dist, dfArc(vec2(left.x + r, left.y + r), -1.57, 1.57, r, uv));
    return dist;
}

void main() {
    if(true) {
		//  read or init data
        init_or_read();

		//  draw;
        float flicker_amount1 = pow(sin(time / 2.11), 2.) * 0.03;
        float flicker_amount2 = pow(sin(time / 1.33), 2.) * 0.03;
        float tf1 = (1. - flicker_amount1) + (flicker(time) * flicker_amount1);
        float tf2 = (1. - flicker_amount2) + (flicker(time + 1337.) * flicker_amount2);
        float bright1 = BRIGHTNESS * min(1.0, 1.0 - sin(tf1 * pi * 50.0) / (tf1 * pi * 1.3));
        float bright2 = BRIGHTNESS * min(1.0, 1.0 - sin(tf2 * pi * 50.0) / (tf2 * pi * 1.3));

        vec2 pos;
        vec3 signColor;
        float dist, shade;

        vec3 color = vec3(0.);

        pos = vec2(0.23, 0.25);
        signColor = vec3(.05, .2, 1.);
        dist = dfPlayer(fromScreen(gl_FragCoord.xy / resolution));
        shade = bright1 / max(epsilon, dist - THICKNESS);
        color += signColor * shade;

        pos = vec2(0.23, 0.25);
        signColor = vec3(.05, .2, 1.);
        dist = dfScoreP1(fromScreen(gl_FragCoord.xy / resolution), player_score * 10.0);
        shade = bright1 / max(epsilon, dist - THICKNESS);
        color += signColor * shade;
        pos = vec2(0.23, 0.25);
        signColor = vec3(1., .2, .1);
        dist = dfScoreP2(fromScreen(gl_FragCoord.xy / resolution), bot_score * 10.0);
        shade = bright1 / max(epsilon, dist - THICKNESS);
        color += signColor * shade;

        pos = vec2(0.0, 0.0);
        signColor = vec3(.05, .2, 1.);
        dist = dfGameLeft(fromScreen(gl_FragCoord.xy / resolution), vec2(0.5 - screenWidth / 2.0, 0.5 - screenHeight / 2.0), vec2(0.5 + screenWidth / 2.0, 0.5 + screenHeight / 2.0));
        shade = bright2 / max(epsilon, dist - THICKNESS);
        color += signColor * shade;
        pos = vec2(0.0, 0.0);
        signColor = vec3(1., .2, .1);
        dist = dfGameRight(fromScreen(gl_FragCoord.xy / resolution), vec2(0.5 - screenWidth / 2.0, 0.5 - screenHeight / 2.0), vec2(0.5 + screenWidth / 2.0, 0.5 + screenHeight / 2.0));
        shade = bright1 / max(epsilon, dist - THICKNESS);
        color += signColor * shade;
        pos = vec2(0.23, 0.25);
        signColor = vec3(1., .2, .1);
        dist = dfBot(fromScreen(gl_FragCoord.xy / resolution));
        shade = bright1 / max(epsilon, dist - THICKNESS);
        color += signColor * shade;
        pos = vec2(0.23, 0.25);
        signColor = vec3(1., 1.0, .1);
        dist = dfBall(fromScreen(gl_FragCoord.xy / resolution));
        shade = bright2 / max(epsilon, dist - THICKNESS);
        color += signColor * shade;

        pos = vec2(0.23, 0.25);
        signColor = vec3(1., 1.0, .1);
        dist = dfCenterCountDown(fromScreen(gl_FragCoord.xy / resolution), start_game * 3.0);
        shade = bright2 / max(epsilon, dist - THICKNESS);
        color += signColor * shade;
        pos = vec2(0.23, 0.25);
        signColor = vec3(0.1, 1.0, .1);
        dist = dfCenterCountDownOff(fromScreen(gl_FragCoord.xy / resolution), start_game * 3.0);
        shade = bright2 / max(epsilon, dist - THICKNESS);
        color += signColor * shade;
        gl_FragColor = vec4(gl_FragColor.xyz + color, 1.0);

		//  update all and save
        tick();
        saveData();
    } else {
        gl_FragColor = vec4(0.0);
    }
}