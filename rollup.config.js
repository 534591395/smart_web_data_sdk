import npm from 'rollup-plugin-npm';
import babel from 'rollup-plugin-babel';

export default {
    plugins: [
        //async(),
        npm({
            browser: true,
            main: true,
            jsnext: true,
        }),
        babel()
    ]
}
