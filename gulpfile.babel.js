import gulp from 'gulp';
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import gulpif from 'gulp-if';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';
import imagemin from 'gulp-imagemin';
import del from 'del';
import webpack from 'webpack-stream';
import named from 'vinyl-named';
import browserSync from 'browser-sync';
import zip from 'gulp-zip'
import replace from 'gulp-replace'
import info from 'package.json'
const server = browserSync.create();
//genera una bandera con el ultimo
const PRODUCTION = yargs.argv.prod;
const paths = {
  styles: {
    src: ['src/asses/scss/bundle.scss'],
    dest: 'dist/asses/css'
  },
  images: {
    src: ['src/asses/images/**/*/.{jpg,jpeg,png,svg,gif}'],
    dest: 'dist/asses/images'
  },
  //para compiar los archivos a la carpeta final, las direcciones despues de la primera
  //es para excluir a los archivos en esos lugares

  scripts: {
    src: ['src/asses/js/**/*'],
    dest: 'dist/asses'
  },
  other: {
    src: [
      'src/asses/**/*',
      '!src/asses/{images,js,scss}',
      '!src/asses/{images,js,scss}/**/*'
    ],
    dest: 'dist/asses'
},
package:{
  src:['**/*','!.vscode','"node_modules{,**}','!packaged{,**}','!src{,/**}','!.babelrc','!.gitignore','!gulpfile.babel.js','!package.json','!yarn.lock'],
  dest:"packaged"
}
}

export const serve = done => {
  server.init({
    proxy: 'http://localhost:8080'
  });
  done()
};
export const reload (done){
  server.reload();
  done()
}
//para evitar la creacion de carpetas innesesarias
export const clean = () => {
  return del(['dist']);
};
export const styles = done => {
  return (
    gulp
      //en caso de mas de un archivo, colocamos dentro de un array
      .src(paths.styles.src)
      .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
      .pipe(sass().on('error', sass.logError))
      //SOLO CORRERA ESTA TAREA CON LA BANDERA DE PRODUCCION ACTIVADA
      .pipe(gulpif(PRODUCTION, autoprefixer()))
      .pipe(gulpif(PRODUCTION, cleanCSS({ compatibility: 'ie8' })))
      .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
      .pipe(gulp.dest(paths.styles.dest))
      .pipe(server.stream())
  );
};

export const images = () => {
  return gulp
    .src(paths.images.src)
    .pipe(gulpif(PRODUCTION, imagemin()))
    .pipe(gulp.dest(paths.images.dest));
};
export const scripts = () => {
  return gulp
    .src(paths.scripts.src)
    .pipe(named())
    .pipe(
      webpack({
        module: {
          rules: [
            {
              test: /\.js$/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['babel-preset-env']
                }
              }
            }
          ]
        },
        output: {
          filename: 'bundle.js'
        },
        externals: {
          jquery: 'jQuery'
        },
        devtool: !PRODUCTION ? 'inline-source-map' : false,
        mode: PRODUCTION ? 'production' : 'development'
      })
    );
  gulp.dest(paths.scripts.dest);
};

export const watch = () => {
  /** = todos los archivos detectados con la extension */
  /* El segundo argumento es para entregar que tarea se realizara cuando cambien estos archivos*/
  gulp.watch(paths.other.src, styles);
  gulp.watch(paths.scripts.src), gulp.series(scripts,reload);
  gulp.watch('**/*.php'),reload;
  gulp.watch(paths.images.src, gulp.series(images,reload));
  gulp.watch(paths.other.src, copy);
};

export const copy = () => {
  return gulp.src(paths.other.src).pipe(gulp.dest(paths.other.dest));
};
export const compress = () =>{
  return gulp.src(paths.package.src).pipe(replace('_themename',info.named)).pipe( zip(`${info.named}.zip`)).pipe(gulp.dest(paths.package.dest))
}
export const dev = gulp.series(
  clean,
  gulp.parallel(styles, scripts, images, copy),
  watch
);
//permite realizar mas de una tarea, de manera secuancial en un solo comando
//parallel permite correr tareas al mismo tiempo
export const build = gulp.series(
  clean,
  gulp.parallel(styles, scripts, images, copy)
);

export const bundle = gulp.series(build,compress);
/*-------------Estilos-----------------*/
// yargs => añadir argumentos para produccion -yarg
//gulp --prod=saodkasodmas
//gulp-sass transforma sass a css
//gulp-clean-css minify css
//gulp-if permite declaracion if en gulp
//source-maps entrega el origen de los archivos durante el desarrollo
//gulp-autoprefixer genera automaticamente los cambios a los demas navegadores
/*-------------Estilos-----------------*/
/*---------------Imagenes------------- */
//gulp-imagemin minifica las imagenes
/*---------------Imagenes------------- */
/*---------------Javascript------------- */
//webpack-stream para utilizar webpack con gulp
/*---------------Javascript------------- */
// yarn add yargs gulp-sass gulp-clean-css gulp-if gulp-sourcemaps gulp-autoprefixer gulp-imagemin webpack-stream
//yarn add babel-loader vinyl-named -D

export default dev;
