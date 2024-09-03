export function deepcopy(target){

    if(typeof target === 'object'){
        const result = Array.isArray(target)?[]: {};
        for(const key in target){
            if(typeof target[key]== 'object'){
                result[key]= deepcopy(target[key]);
            } else {
                result[key]= target[key];
            }
        }
        return result;
    }
    return target
}
